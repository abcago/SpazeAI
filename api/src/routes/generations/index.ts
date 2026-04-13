import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  generations,
  generationTypes,
  users,
  transactions,
  userSubscriptions,
  subscriptionPlans,
} from "../../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../../middleware/auth.js";
import {
  createGenerationSchema,
  generationQuerySchema,
} from "../../lib/schemas.js";
import { uploadImage, uploadImageFromUrl, uploadResultFromUrl, uploadBuffer } from "../../lib/r2.js";
import { isLikelyNSFWFilteredImage, NSFWFilteredError } from "../../lib/content-safety.js";
import { env } from "../../lib/env.js";

const gens = new Hono<AuthEnv>();

gens.use("/*", authMiddleware);

// ── Create Generation (bridge to FAL.ai) ────────────────
gens.post("/", async (c) => {
  const user = c.get("user");
  const body = createGenerationSchema.parse(await c.req.json());

  // Get generation type
  const [genType] = await db
    .select()
    .from(generationTypes)
    .where(
      and(
        eq(generationTypes.id, body.generationTypeId),
        eq(generationTypes.isActive, true)
      )
    )
    .limit(1);

  if (!genType) return c.json({ error: "Generation type not found or inactive" }, 404);

  // Get user with period usage, role, and subscription info
  const [dbUser] = await db
    .select({
      coinBalance: users.coinBalance,
      generationsThisPeriod: users.generationsThisPeriod,
      periodResetAt: users.periodResetAt,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (!dbUser) return c.json({ error: "User not found" }, 404);

  // Reset / bootstrap the period counter.
  // - If no periodResetAt is set yet (legacy users / free tier on first
  //   generation), bootstrap a 30-day window starting now.
  // - If the existing window has expired, reset the counter and start
  //   a fresh 30-day window.
  let periodCount = dbUser.generationsThisPeriod;
  const now = new Date();
  if (!dbUser.periodResetAt) {
    const newReset = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await db
      .update(users)
      .set({ periodResetAt: newReset, updatedAt: now })
      .where(eq(users.id, user.sub));
  } else if (now > dbUser.periodResetAt) {
    const newReset = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await db
      .update(users)
      .set({
        generationsThisPeriod: 0,
        periodResetAt: newReset,
        updatedAt: now,
      })
      .where(eq(users.id, user.sub));
    periodCount = 0;
  }

  // Look up active subscription to enforce period cap
  const FREE_TIER_MONTHLY_CAP = 30;
  let maxGensPerPeriod = FREE_TIER_MONTHLY_CAP;

  const [activeSub] = await db
    .select({ plan: subscriptionPlans })
    .from(userSubscriptions)
    .innerJoin(
      subscriptionPlans,
      eq(userSubscriptions.planId, subscriptionPlans.id)
    )
    .where(
      and(
        eq(userSubscriptions.userId, user.sub),
        eq(userSubscriptions.status, "active")
      )
    )
    .limit(1);

  if (activeSub) {
    maxGensPerPeriod = activeSub.plan.maxGenerationsPerPeriod;
  }

  // GOD MODE: admins bypass all generation limits.
  const isAdmin = dbUser.role === "admin";

  if (!isAdmin && periodCount >= maxGensPerPeriod) {
    return c.json(
      {
        error: "Generation limit reached",
        message: activeSub
          ? `You've used all ${maxGensPerPeriod} generations for this billing period. Limit resets when your subscription renews.`
          : `Free tier limit of ${maxGensPerPeriod} generations per month reached. Subscribe to unlock more.`,
        limitType: activeSub ? "subscription" : "free_tier",
        used: periodCount,
        max: maxGensPerPeriod,
      },
      429
    );
  }

  if (!isAdmin && dbUser.coinBalance < genType.coinCost) {
    return c.json({ error: "Insufficient coins" }, 402);
  }

  // Upload input image(s) to R2
  let inputImageUrl: string | null = null;
  let inputImageUrl2: string | null = null;

  try {
    const inputBuffer = Buffer.from(body.inputImage, "base64");
    inputImageUrl = await uploadImage(inputBuffer, "inputs");

    if (body.inputImage2) {
      const inputBuffer2 = Buffer.from(body.inputImage2, "base64");
      inputImageUrl2 = await uploadImage(inputBuffer2, "inputs");
    }
  } catch (err) {
    return c.json({ error: "Failed to upload input image" }, 500);
  }

  // Create generation record
  const [generation] = await db
    .insert(generations)
    .values({
      userId: user.sub,
      generationTypeId: genType.id,
      inputImageUrl,
      inputImageUrl2,
      status: "generating",
      coinCost: genType.coinCost,
    })
    .returning();

  // Deduct coins and bump period counter
  await db
    .update(users)
    .set({
      coinBalance: dbUser.coinBalance - genType.coinCost,
      totalGenerations: (await db
        .select({ count: count() })
        .from(generations)
        .where(eq(generations.userId, user.sub))
      )[0].count,
      generationsThisPeriod: periodCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.sub));

  // Record transaction
  await db.insert(transactions).values({
    userId: user.sub,
    type: "generation",
    coinAmount: -genType.coinCost,
    generationId: generation.id,
    description: `Generation: ${genType.name}`,
  });

  // Call FAL.ai asynchronously
  processGeneration(generation.id, genType, body.inputImage, body.inputImage2).catch(
    (err) => console.error(`Generation ${generation.id} failed:`, err)
  );

  return c.json(generation, 201);
});

// ── Get generation status ───────────────────────────────
gens.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [item] = await db
    .select()
    .from(generations)
    .where(and(eq(generations.id, id), eq(generations.userId, user.sub)))
    .limit(1);

  if (!item) return c.json({ error: "Generation not found" }, 404);
  return c.json(item);
});

// ── List user's generations ─────────────────────────────
gens.get("/", async (c) => {
  const user = c.get("user");
  const query = generationQuerySchema.parse(c.req.query());
  const offset = (query.page - 1) * query.limit;

  const conditions = [eq(generations.userId, user.sub)];
  if (query.typeId) conditions.push(eq(generations.generationTypeId, query.typeId));
  if (query.status) conditions.push(eq(generations.status, query.status));

  const where = and(...conditions);

  const [items, [total]] = await Promise.all([
    db
      .select()
      .from(generations)
      .where(where)
      .orderBy(desc(generations.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(generations).where(where),
  ]);

  return c.json({
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: total.count,
      totalPages: Math.ceil(total.count / query.limit),
    },
  });
});

/** Helper: call any FAL endpoint with a JSON body, return parsed JSON. */
async function callFal(
  model: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<{ images?: { url: string }[]; video?: { url: string }; output?: string }> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FAL API error: ${res.status} ${errText}`);
  }
  return res.json() as Promise<{
    images?: { url: string }[];
    video?: { url: string };
    output?: string;
  }>;
}

// ── Background FAL.ai processing ────────────────────────
async function processGeneration(
  generationId: string,
  genType: typeof generationTypes.$inferSelect,
  inputBase64: string,
  inputBase64_2?: string
) {
  const falApiKey = env.FAL_API_KEY || (await getSettingValue("falApiKey"));

  if (!falApiKey) {
    await db
      .update(generations)
      .set({ status: "failed", errorMessage: "FAL API key not configured", updatedAt: new Date() })
      .where(eq(generations.id, generationId));
    return;
  }

  try {
    // Detect multi-step pipeline (e.g. PuLID then Kontext for face+car)
    const pipeline = (genType.metadata as Record<string, unknown> | null)?.pipeline as string | undefined;
    let result: { images?: { url: string }[]; video?: { url: string }; output?: string };

    if (pipeline === "product_wizard") {
      result = await runProductWizardPipeline(
        genType,
        inputBase64,
        falApiKey
      );
    } else if (pipeline === "kontext_then_faceswap") {
      result = await runKontextThenFaceSwapPipeline(
        genType,
        inputBase64,
        inputBase64_2,
        falApiKey
      );
    } else if (pipeline === "pulid_then_kontext") {
      result = await runPulidThenKontextPipeline(
        genType,
        inputBase64,
        inputBase64_2,
        falApiKey
      );
    } else {
      const requestBody = buildFalRequestBody(genType, inputBase64, inputBase64_2);
      result = await callFal(genType.falModel, requestBody, falApiKey);
    }

    // Extract result URL — different models return different shapes
    let resultUrl: string | null = null;
    let resultUrl2: string | null = null;

    if (result.video?.url) {
      // Video models (sadtalker, live-portrait)
      resultUrl = result.video.url;
    } else if (result.output && typeof result.output === "string") {
      // Some models return a direct output URL
      resultUrl = result.output;
    } else if (result.images?.length) {
      // Image models (flux-pulid etc)
      resultUrl = result.images[0].url;
      if (result.images.length > 1) {
        resultUrl2 = result.images[1].url;
      }
    }

    if (!resultUrl) {
      throw new Error("No output in FAL response");
    }

    // Upload results to R2
    const isVideo = genType.falModel.includes("sadtalker") || genType.falModel.includes("live-portrait");
    const folder = isVideo ? "videos" : "generations";

    // Download and validate the primary result before uploading
    const primaryRes = await fetch(resultUrl);
    if (!primaryRes.ok) throw new Error(`Failed to fetch result: ${primaryRes.status}`);
    const primaryBuffer = Buffer.from(await primaryRes.arrayBuffer());
    const primaryContentType = primaryRes.headers.get("content-type") ?? "image/jpeg";

    if (isLikelyNSFWFilteredImage(primaryBuffer, primaryContentType)) {
      throw new NSFWFilteredError();
    }

    const resultImageUrl = await uploadBuffer(primaryBuffer, primaryContentType, folder);
    let resultImageUrl2: string | null = null;

    if (resultUrl2) {
      const secondRes = await fetch(resultUrl2);
      if (secondRes.ok) {
        const secondBuffer = Buffer.from(await secondRes.arrayBuffer());
        const secondContentType = secondRes.headers.get("content-type") ?? "image/jpeg";
        if (isLikelyNSFWFilteredImage(secondBuffer, secondContentType)) {
          throw new NSFWFilteredError();
        }
        resultImageUrl2 = await uploadBuffer(secondBuffer, secondContentType, folder);
      }
    }

    await db
      .update(generations)
      .set({
        status: "completed",
        resultImageUrl,
        resultImageUrl2,
        updatedAt: new Date(),
      })
      .where(eq(generations.id, generationId));

    // Increment usage count
    await db
      .update(generationTypes)
      .set({ totalUsageCount: genType.totalUsageCount + 1 })
      .where(eq(generationTypes.id, genType.id));
  } catch (err: any) {
    console.error(`Generation ${generationId} failed:`, err);

    const userFriendlyMessage =
      err instanceof NSFWFilteredError
        ? "Görsel uygunsuz içerik filtresi tarafından engellendi. Lütfen farklı bir fotoğraf ile tekrar deneyin. Coinleriniz iade edildi."
        : err.message ?? "Unknown error";

    await db
      .update(generations)
      .set({
        status: "failed",
        errorMessage: userFriendlyMessage,
        updatedAt: new Date(),
      })
      .where(eq(generations.id, generationId));

    // Refund coins
    const [gen] = await db
      .select()
      .from(generations)
      .where(eq(generations.id, generationId))
      .limit(1);

    if (gen) {
      await db
        .update(users)
        .set({ coinBalance: (await db.select({ coinBalance: users.coinBalance }).from(users).where(eq(users.id, gen.userId)).limit(1))[0].coinBalance + gen.coinCost })
        .where(eq(users.id, gen.userId));

      await db.insert(transactions).values({
        userId: gen.userId,
        type: "refund",
        coinAmount: gen.coinCost,
        generationId: gen.id,
        description: `Refund: generation failed`,
      });
    }
  }
}

/**
 * Face attributes detected from a portrait photo.
 * Used to make the kontext-generated placeholder person resemble
 * the user before the face swap step. The closer the placeholder
 * is to the source identity, the better the swap result.
 */
type FaceAttributes = {
  gender: "male" | "female" | null;
  age: string | null;          // e.g. "twenties", "thirties"
  ethnicity: string | null;    // e.g. "caucasian", "asian", "middle eastern"
  hair: string | null;         // e.g. "short black", "long blonde wavy"
  outfit: string | null;       // e.g. "white t-shirt", "black hoodie"
  accessories: string | null;  // e.g. "glasses", "earrings"
};

async function detectFaceAttributes(
  imageDataUri: string,
  apiKey: string
): Promise<FaceAttributes> {
  const question =
    "Analyze the person in this photo and respond with EXACTLY one line in this " +
    "pipe-separated format (no other text, no explanation, no preamble):\n" +
    "gender|age|ethnicity|hair|outfit|accessories\n\n" +
    "Field rules:\n" +
    "- gender: male or female\n" +
    "- age: twenties, thirties, forties, fifties, or older\n" +
    "- ethnicity: caucasian, asian, middle eastern, hispanic, black, or mixed\n" +
    "- hair: 3-5 words describing length + style + colour, e.g. 'long wavy brown' " +
    "or 'short black straight' or 'shoulder-length blonde with bangs'\n" +
    "- outfit: 2-4 words describing the top, e.g. 'white t-shirt' or 'black leather jacket'; " +
    "write 'unknown' if not visible\n" +
    "- accessories: glasses, hat, earrings, necklace, beard, mustache; comma-separated; or 'none'\n\n" +
    "Example response: female|twenties|asian|long black straight|white sweater|silver earrings\n" +
    "Now describe THIS photo:";

  const tryModels: Array<{
    model: string;
    body: Record<string, unknown>;
  }> = [
    { model: "fal-ai/moondream2", body: { image_url: imageDataUri, prompt: question } },
    { model: "fal-ai/llavav15-13b", body: { image_url: imageDataUri, prompt: question } },
    { model: "fal-ai/florence-2-large", body: { image_url: imageDataUri, task_prompt: "<MORE_DETAILED_CAPTION>" } },
  ];

  for (const t of tryModels) {
    try {
      const res = await callFal(t.model, t.body, apiKey);
      const text = JSON.stringify(res);
      const parsed = parseFaceAttributes(text);
      if (parsed.gender) {
        console.log(
          `[face-attrs] via ${t.model}: ${parsed.gender}|${parsed.age}|${parsed.ethnicity}|${parsed.hair}|${parsed.outfit}|${parsed.accessories}`
        );
        return parsed;
      }
    } catch (err) {
      console.warn(`[face-attrs] ${t.model} failed:`, (err as Error).message);
    }
  }

  return { gender: null, age: null, ethnicity: null, hair: null, outfit: null, accessories: null };
}

function parseFaceAttributes(text: string): FaceAttributes {
  const lower = text.toLowerCase();

  // Try the structured "gender|age|ethnicity|hair|outfit|accessories" format first
  const pipeMatch = lower.match(
    /(male|female)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^"|\\\n]+)/
  );
  if (pipeMatch) {
    const clean = (s: string) => s.trim().replace(/[".]/g, "");
    return {
      gender: pipeMatch[1] as "male" | "female",
      age: clean(pipeMatch[2]),
      ethnicity: clean(pipeMatch[3]),
      hair: clean(pipeMatch[4]),
      outfit: clean(pipeMatch[5]) === "unknown" ? null : clean(pipeMatch[5]),
      accessories: clean(pipeMatch[6]) === "none" ? null : clean(pipeMatch[6]),
    };
  }

  // Older 4-field format fallback
  const oldPipeMatch = lower.match(/(male|female)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^"|\\\n]+)/);
  if (oldPipeMatch) {
    return {
      gender: oldPipeMatch[1] as "male" | "female",
      age: oldPipeMatch[2].trim(),
      ethnicity: oldPipeMatch[3].trim(),
      hair: oldPipeMatch[4].trim().replace(/[".]/g, ""),
      outfit: null,
      accessories: null,
    };
  }

  // Fall back to keyword extraction from any descriptive text
  let gender: "male" | "female" | null = null;
  if (/\b(female|woman|girl|lady|she|her)\b/.test(lower)) gender = "female";
  else if (/\b(male|man|boy|guy|he|him|his)\b/.test(lower)) gender = "male";

  const ageMatch = lower.match(/\b(twenties|thirties|forties|fifties|older|young|middle[- ]aged|teen|elderly)\b/);
  const ethnicityMatch = lower.match(/\b(caucasian|asian|middle[- ]eastern|hispanic|latino|black|african|mixed|south asian|indian)\b/);
  const hairMatch = lower.match(/\b(short|long|medium|shoulder[- ]length)?\s*(black|brown|blonde|blond|red|ginger|grey|gray|silver|auburn|dark|light)\s*hair\b/);

  return {
    gender,
    age: ageMatch?.[1] ?? null,
    ethnicity: ethnicityMatch?.[1] ?? null,
    hair: hairMatch ? `${hairMatch[1] ?? ""} ${hairMatch[2]} hair`.trim() : null,
    outfit: null,
    accessories: null,
  };
}

/** Pre-enhance a face image with CodeFormer for better swap quality. */
async function enhanceFaceImage(
  imageDataUri: string,
  apiKey: string
): Promise<string> {
  try {
    const res = await callFal(
      "fal-ai/codeformer",
      { image_url: imageDataUri, fidelity: 1.0, upscaling: 2 },
      apiKey
    );
    const norm = normaliseFaceSwapResult(res);
    if (norm) {
      console.log("[face-pre] source face enhanced");
      return norm.images[0].url;
    }
  } catch (err) {
    console.warn("[face-pre] enhance failed, using original:", (err as Error).message);
  }
  return imageDataUri;
}

/**
 * Product info detected from a single product photo via VQA.
 * Used by the Product Wizard pipeline to pick an appropriate marketing
 * template and generate a polished introduction image.
 */
type ProductInfo = {
  type: string;        // canonical product type, e.g. "perfume", "watch"
  description: string; // 5-15 word description including brand if visible
};

const PRODUCT_TYPES = [
  "perfume", "skincare", "lipstick", "makeup", "watch", "jewelry",
  "handbag", "sunglasses", "coffee", "wine", "alcohol", "food", "drink",
  "tech", "phone", "laptop", "headphones", "tablet", "smartwatch",
  "clothing", "shoes", "sneakers", "furniture", "book", "toy",
  "plant", "flowers", "sports", "beauty", "candle", "other",
];

async function detectProduct(
  imageDataUri: string,
  apiKey: string
): Promise<ProductInfo> {
  const question =
    "Look at the product in this photo and respond with EXACTLY one line in this " +
    "pipe-separated format (no other text, no explanation):\n" +
    "type|description\n\n" +
    "Field rules:\n" +
    "- type: pick ONE word that best describes the product. Choose from: " +
    PRODUCT_TYPES.join(", ") + "\n" +
    "- description: 5-15 words describing what the product is, including brand name " +
    "if a logo or label is visible\n\n" +
    "Example: perfume|Chanel No.5 Eau de Parfum 100ml in classic clear glass bottle\n" +
    "Example: sneakers|White Nike Air Force 1 low-top leather sneaker with red swoosh\n" +
    "Now describe THIS product:";

  const tryModels: Array<{ model: string; body: Record<string, unknown> }> = [
    { model: "fal-ai/moondream2", body: { image_url: imageDataUri, prompt: question } },
    { model: "fal-ai/llavav15-13b", body: { image_url: imageDataUri, prompt: question } },
  ];

  for (const t of tryModels) {
    try {
      const res = await callFal(t.model, t.body, apiKey);
      const text = JSON.stringify(res);
      const parsed = parseProductInfo(text);
      if (parsed) {
        console.log(`[wizard] detected via ${t.model}: ${parsed.type} | ${parsed.description}`);
        return parsed;
      }
    } catch (err) {
      console.warn(`[wizard] ${t.model} failed:`, (err as Error).message);
    }
  }

  return { type: "other", description: "premium product" };
}

function parseProductInfo(text: string): ProductInfo | null {
  const lower = text.toLowerCase();

  // Try the structured "type|description" format
  const pipeMatch = lower.match(/(\w[\w\s-]*)\s*\|\s*([^"|\\\n]{3,200})/);
  if (pipeMatch) {
    const rawType = pipeMatch[1].trim();
    const desc = pipeMatch[2].trim().replace(/[".]/g, "");

    // Normalise the type to a canonical bucket
    const matchedType =
      PRODUCT_TYPES.find((t) => rawType.includes(t)) ||
      PRODUCT_TYPES.find((t) => desc.includes(t)) ||
      "other";

    return { type: matchedType, description: desc };
  }

  // Fallback: look for any product keyword in the response
  for (const type of PRODUCT_TYPES) {
    if (lower.includes(type)) {
      return { type, description: lower.slice(0, 150) };
    }
  }

  return null;
}

/**
 * Product-type-specific marketing prompt templates.
 * Each template is designed to showcase a specific product category
 * in the most visually compelling way for advertising/marketing.
 *
 * The {description} placeholder is replaced at runtime with the
 * VQA-detected product description.
 */
const WIZARD_TEMPLATES: Record<string, string> = {
  perfume:
    "Create a photorealistic luxury perfume advertising photograph featuring the EXACT product from image 1 ({description}). The bottle must be PIXEL-PERFECT identical to the input — same shape, label text, brand logo, colour, every detail unchanged. Add a beautiful elegant young woman holding the bottle near her face with a serene seductive expression, soft glamorous makeup, hair styled. Soft cream studio backdrop with subtle gradient. Classic beauty butterfly lighting from above, dreamy soft fill, glowing skin highlights. Both product and model razor-sharp at f/4. Shot on Hasselblad medium format with 100mm portrait lens, Chanel / Dior perfume ad aesthetic. Strictly ONE product and ONE model in the frame.",

  skincare:
    "Create a photorealistic premium skincare brand campaign photograph featuring the EXACT product from image 1 ({description}). The product must be PIXEL-PERFECT identical to the input — preserve every detail. Add a fresh-faced young woman with glowing dewy skin holding the product gently near her cheek with a soft genuine smile. Real photographic skin texture, NOT airbrushed. Clean spa-like minimalist white backdrop with subtle natural elements. Bright natural soft window light, fresh morning aesthetic. Razor-sharp at f/4. Shot on Sony A7R V with 85mm portrait lens, La Mer / Estée Lauder / Glossier campaign aesthetic. Strictly ONE product and ONE model.",

  lipstick:
    "Create a photorealistic high-end beauty close-up advertising photograph featuring the EXACT product from image 1 ({description}). The lipstick must be PIXEL-PERFECT identical — same casing, brand logo, colour, every detail unchanged. Add a beautiful woman holding the lipstick near her lips, lips slightly parted with the bold lipstick colour from the product visibly applied to her lips matching the product shade. Eyes looking off-camera with editorial intensity. Real photographic skin texture (visible pores, natural human imperfections). Clean dark backdrop in a tone complementing the lipstick. Classic beauty butterfly lighting with strong rim light on the cheekbones. Razor-sharp at f/8 macro. Shot on Phase One IQ4 medium format with 120mm macro lens, Allure / Harper's Bazaar Beauty aesthetic. Strictly ONE product and ONE model, head-and-shoulders crop.",

  makeup:
    "Create a photorealistic premium makeup advertising photograph featuring the EXACT product from image 1 ({description}). The makeup product must be PIXEL-PERFECT identical to the input. Add a beautiful model with editorial makeup demonstrating the product, holding it elegantly near her face. Polished glamour expression, real photographic skin texture, NOT airbrushed. Clean studio backdrop in a complementary tone. Beauty butterfly lighting from above, soft fill, magazine-cover quality. Razor-sharp at f/8. Shot on Hasselblad with 100mm portrait lens, MAC / NARS / Sephora campaign aesthetic. Strictly ONE product and ONE model.",

  watch:
  "Create a photorealistic luxury watch lifestyle advertising photograph featuring the EXACT product from image 1 ({description}). The watch must be PIXEL-PERFECT identical — same case, dial, hands, brand logo, bezel, strap, every detail unchanged. Add a sophisticated person wearing the watch on their wrist, holding their hand elegantly near their face with the watch face clearly visible to the camera. Confident expression, polished look. Luxurious soft-focus background — high-end hotel lobby or marble studio surface. Warm sophisticated three-point lighting, dramatic key light highlighting the watch face. Razor-sharp at f/4 with the watch in particular focus. Shot on Sony A7R V with 85mm lens, Rolex / Cartier / Omega campaign aesthetic. Strictly ONE product and ONE model.",

  jewelry:
    "Create a photorealistic fine jewelry editorial advertising photograph featuring the EXACT product from image 1 ({description}). The jewelry must be PIXEL-PERFECT identical — same metal colour, gemstones, settings, design, every detail unchanged. Add an elegant woman wearing or showcasing the jewelry prominently. Soft serene fashion-editorial expression. Hair styled to showcase the piece. Bare shoulders or simple sleek black top. Dark velvet or rich burgundy backdrop with subtle texture. Dramatic single key light from above creating soft shadows that highlight the sparkle of the gemstones. Razor-sharp at f/8. Shot on Phase One IQ4 medium format with 100mm macro lens, Tiffany / Cartier / Bulgari campaign aesthetic. Strictly ONE product and ONE model.",

  handbag:
    "Create a photorealistic designer handbag fashion editorial photograph featuring the EXACT product from image 1 ({description}). The handbag must be PIXEL-PERFECT identical — same shape, colour, leather, hardware, brand logo, every detail unchanged. Add a chic woman model carrying the bag elegantly, body angled three-quarters to camera, sophisticated editorial expression. Wearing a tasteful monochrome outfit complementing the bag. Upscale Parisian street or hotel staircase backdrop. Soft directional natural daylight, sophisticated cinematic colour grading. Razor-sharp at f/4. Shot on Canon EOS R5 with 50mm prime, Hermès / Chanel / Louis Vuitton campaign aesthetic. Strictly ONE product and ONE model.",

  sunglasses:
    "Create a photorealistic designer sunglasses lifestyle advertising photograph featuring the EXACT product from image 1 ({description}). The sunglasses must be PIXEL-PERFECT identical — same frame, lens tint, brand logo, every detail unchanged. Add a stylish young person wearing the sunglasses, head tilted slightly back, cool composed confident expression, hair softly windblown. Wearing a chic summer outfit. Sun-soaked outdoor lifestyle setting — French Riviera or Mediterranean rooftop. Bright golden natural sunlight, warm shadows, subtle reflections on the lenses. Razor-sharp at f/4. Shot on Leica Q3 with 28mm prime, Ray-Ban / Persol / Gentle Monster campaign aesthetic. Strictly ONE product and ONE model.",

  coffee:
    "Create a photorealistic premium coffee brand lifestyle advertising photograph featuring the EXACT product from image 1 ({description}). The product (cup/bag/can) must be PIXEL-PERFECT identical — same packaging, brand logo, label, every detail unchanged. Add a person holding the coffee product warmly with both hands near the chest, looking down at it with a serene contented smile, OR shoot the product on a rustic wooden cafe table with steam rising and a hand softly visible reaching for it. Cozy artisan coffee shop with wood and exposed brick backdrop, warm natural window light, golden lifestyle aesthetic. Razor-sharp at f/2.8. Shot on Sony A7 IV with 50mm prime, Blue Bottle / Stumptown / Nespresso aesthetic. Strictly ONE hero product.",

  wine:
    "Create a photorealistic sophisticated wine brand campaign photograph featuring the EXACT product from image 1 ({description}). The wine bottle must be PIXEL-PERFECT identical — same shape, label, vintage year, brand logo, foil, every detail unchanged. Show the wine bottle prominently displayed on an elegant fine-dining restaurant table with two empty wine glasses, a single rose, and warm candlelight, OR shoot it in an upscale wine cellar with stone walls and wooden barrels. Warm intimate candlelight or golden hour lighting, sophisticated sommelier aesthetic. Razor-sharp at f/4. Shot on Canon EOS R5 with 85mm portrait lens, premium wine brand campaign aesthetic. Strictly ONE hero product.",

  alcohol:
    "Create a photorealistic premium spirits brand advertising photograph featuring the EXACT product from image 1 ({description}). The bottle must be PIXEL-PERFECT identical — preserve every detail of the label, shape, brand logo, colour. Show the bottle dramatically lit on a polished bar surface with a complementary cocktail glass beside it, ice cubes, soft amber bokeh background of a luxury bar, dramatic side lighting catching the bottle silhouette. Shot on Phase One IQ4 with 80mm prime, premium liquor brand aesthetic (Macallan / Hennessy / Belvedere). Strictly ONE hero product.",

  food:
    "Create a photorealistic premium food advertising photograph featuring the EXACT product from image 1 ({description}). The food product must be PIXEL-PERFECT identical — preserve every detail of the packaging, label, brand, shape. Show the product styled appetisingly on a clean rustic wooden table with complementary fresh ingredients arranged around it, soft natural window light from one side, food magazine aesthetic. Razor-sharp at f/5.6. Shot on Canon EOS R5 with 50mm prime, premium food brand campaign aesthetic. Strictly ONE hero product.",

  drink:
    "Create a photorealistic premium beverage advertising photograph featuring the EXACT product from image 1 ({description}). The drink container must be PIXEL-PERFECT identical — preserve every detail of the label, shape, brand logo. Show the product on a clean modern surface with cold condensation droplets if appropriate, ice cubes if relevant, and a vibrant lifestyle background. Bright dramatic studio lighting that highlights the product silhouette. Razor-sharp at f/8. Shot on Sony A7R V with 90mm macro lens, premium beverage brand aesthetic (Coca-Cola / Red Bull / La Croix). Strictly ONE hero product.",

  tech:
    "Create a photorealistic premium tech product advertising photograph featuring the EXACT product from image 1 ({description}). The tech product must be PIXEL-PERFECT identical — preserve every detail (shape, colour, brand logo, screen design, ports, buttons). Show the product on a clean modern minimalist desk surface with subtle complementary props (a keyboard, a coffee, a notebook) softly out of focus around it. Bright clean Apple-style studio lighting. Razor-sharp at f/8 with floating product hero shot aesthetic. Shot on Sony A7R V with 90mm macro lens, Apple / Bose / Samsung campaign aesthetic. Strictly ONE hero product.",

  phone: "USE_TEMPLATE_TECH",
  laptop: "USE_TEMPLATE_TECH",
  headphones: "USE_TEMPLATE_TECH",
  tablet: "USE_TEMPLATE_TECH",
  smartwatch: "USE_TEMPLATE_TECH",

  clothing:
    "Create a photorealistic fashion editorial product photograph featuring the EXACT clothing item from image 1 ({description}). The garment must be PIXEL-PERFECT identical — preserve every detail of fabric, colour, pattern, stitching, brand label. Add a stylish young model wearing the garment in a confident editorial pose against a clean studio backdrop. Soft directional fashion lighting. Razor-sharp at f/4. Shot on Hasselblad with 80mm prime, premium fashion brand campaign aesthetic. Strictly ONE garment and ONE model.",

  shoes: "USE_TEMPLATE_SNEAKERS",
  sneakers:
    "Create a photorealistic premium sneaker advertising photograph featuring the EXACT product from image 1 ({description}). The sneaker must be PIXEL-PERFECT identical — preserve every detail of colour, brand logo, sole, laces, every panel. Show the sneaker as a hero product shot with a complementary geometric backdrop, dramatic side lighting that catches the silhouette and the brand logo, a subtle hint of a person's leg or full body wearing it in the background softly out of focus. Razor-sharp at f/8. Shot on Sony A1 with 90mm macro lens, Nike / Adidas / On / New Balance campaign aesthetic. Strictly ONE hero product.",

  furniture:
    "Create a photorealistic premium furniture advertising photograph featuring the EXACT product from image 1 ({description}). The furniture piece must be PIXEL-PERFECT identical — preserve every detail of shape, colour, material, texture. Show the furniture in a beautifully styled modern living space with complementary decor (plants, art, soft textiles) carefully arranged around it. Soft natural window light, warm welcoming interior design magazine aesthetic. Razor-sharp at f/5.6. Shot on Sony A7R V with 24mm wide prime, Architectural Digest / Dwell campaign aesthetic. Strictly ONE hero product.",

  book:
    "Create a photorealistic premium book advertising photograph featuring the EXACT product from image 1 ({description}). The book cover must be PIXEL-PERFECT identical — preserve every detail of the title, author name, cover art, spine, every word and graphic. Show the book elegantly displayed on a wooden cafe table or cosy reading nook with complementary props (a cup of coffee, reading glasses, a soft throw blanket) softly arranged around it. Warm natural window light, cosy lifestyle bookstore aesthetic. Razor-sharp at f/4. Shot on Fujifilm X-T5 with 35mm prime, premium publisher campaign aesthetic. Strictly ONE hero product.",

  toy:
    "Create a photorealistic premium toy advertising photograph featuring the EXACT product from image 1 ({description}). The toy must be PIXEL-PERFECT identical — preserve every detail of colour, shape, brand markings, every accessory. Show the toy as a hero product shot on a clean colourful playful backdrop with subtle complementary props arranged around it. Bright cheerful studio lighting. Razor-sharp at f/8. Shot on Canon EOS R5 with 50mm prime, premium toy brand campaign aesthetic (LEGO / Mattel / Hasbro). Strictly ONE hero product.",

  plant:
    "Create a photorealistic premium plant lifestyle advertising photograph featuring the EXACT plant from image 1 ({description}). The plant must be PIXEL-PERFECT identical — preserve every leaf, every detail of the pot, every nuance of the foliage. Show the plant in a beautifully styled modern interior on a wooden side table or shelf with subtle complementary decor (books, ceramics, soft natural light from a window). Warm indoor home aesthetic. Razor-sharp at f/4. Shot on Sony A7 IV with 35mm prime, premium plant brand / interior design magazine aesthetic. Strictly ONE hero plant.",

  flowers:
    "Create a photorealistic premium floral arrangement advertising photograph featuring the EXACT flowers from image 1 ({description}). The flowers must be PIXEL-PERFECT identical — preserve every petal, colour, arrangement, vase if visible. Show the flowers beautifully styled on a clean elegant surface with soft natural window light from one side, dreamy soft bokeh background, magazine floral arrangement aesthetic. Razor-sharp at f/4. Shot on Canon EOS R5 with 100mm macro lens, premium florist brand campaign aesthetic. Strictly ONE hero arrangement.",

  sports:
    "Create a photorealistic premium sports equipment advertising photograph featuring the EXACT product from image 1 ({description}). The equipment must be PIXEL-PERFECT identical — preserve every detail of brand logo, colour, material, shape. Show the equipment as a dynamic hero shot with a complementary athletic environment background (a court, field, gym, or outdoor setting), dramatic side lighting that highlights the equipment's form and brand. Razor-sharp at f/8. Shot on Sony A1 with 70-200mm telephoto, premium sports brand campaign aesthetic. Strictly ONE hero product.",

  beauty:
    "Create a photorealistic premium beauty product advertising photograph featuring the EXACT product from image 1 ({description}). The product must be PIXEL-PERFECT identical — preserve every detail of the brand logo, label, shape, colour. Show the product floating on a clean pastel backdrop with subtle complementary beauty props (petals, ribbons, a soft cloth) artfully arranged around it. Bright clean beauty product lighting that catches the product's curves. Razor-sharp at f/8. Shot on Phase One IQ4 with 120mm macro lens, premium beauty brand campaign aesthetic. Strictly ONE hero product.",

  candle:
    "Create a photorealistic premium candle advertising photograph featuring the EXACT product from image 1 ({description}). The candle must be PIXEL-PERFECT identical — preserve every detail of the vessel, label, brand, wax colour, scent name. Show the candle styled on a warm wooden surface with subtle complementary props (a soft throw, an open book, dried flowers, soft warm flickering light if lit). Cosy intimate home aesthetic. Razor-sharp at f/4. Shot on Sony A7 IV with 50mm prime, premium candle brand campaign aesthetic (Diptyque / Jo Malone / Le Labo). Strictly ONE hero product.",

  other:
    "Create a photorealistic premium product hero advertising photograph featuring the EXACT product from image 1 ({description}). The product must be PIXEL-PERFECT identical to the input — preserve every detail (shape, colour, label, brand logo, every word and graphic). Place it on a clean studio backdrop with dramatic three-point lighting that highlights its form and brand. Soft floor reflection, premium magazine campaign aesthetic. Razor-sharp at f/8 deep focus. Shot on Phase One IQ4 medium format with 80mm prime, no HDR, photoreal product photography quality. Strictly ONE hero product in the frame, no other items, clean composition.",
};

function buildWizardPrompt(info: ProductInfo): string {
  let template = WIZARD_TEMPLATES[info.type] ?? WIZARD_TEMPLATES.other;
  // Resolve aliases like phone → tech
  if (template?.startsWith("USE_TEMPLATE_")) {
    const aliasKey = template.replace("USE_TEMPLATE_", "").toLowerCase();
    template = WIZARD_TEMPLATES[aliasKey] ?? WIZARD_TEMPLATES.other;
  }
  return template.replace(/\{description\}/g, info.description);
}

/**
 * Product Wizard Pipeline.
 *
 * Step 1: Detect what the product is via VQA (moondream2 / llava)
 * Step 2: Pick a product-type-specific marketing prompt template
 * Step 3: Generate a polished marketing/intro image with nano-banana-2/edit
 *
 * Single-photo input. The model may include a person if the template
 * for that product type calls for it (perfume, skincare, makeup, etc).
 */
async function runProductWizardPipeline(
  genType: typeof generationTypes.$inferSelect,
  inputBase64: string,
  apiKey: string
): Promise<{ images?: { url: string }[] }> {
  const productDataUri = `data:image/jpeg;base64,${inputBase64}`;

  // Step 1: detect the product
  const productInfo = await detectProduct(productDataUri, apiKey);

  // Step 2: build a product-aware prompt
  const prompt = buildWizardPrompt(productInfo);
  console.log(`[wizard] using template for: ${productInfo.type}`);

  // Step 3: generate
  const result = await callFal(
    "fal-ai/nano-banana-2/edit",
    {
      prompt,
      image_urls: [productDataUri],
      num_images: 1,
      output_format: "jpeg",
    },
    apiKey
  );

  return result;
}

/**
 * BEST 2-step pipeline for "person + car" composites.
 *
 * Step 1 — FLUX Kontext Max (single image, the CAR):
 *   Input: just the user's car photo
 *   Output: that exact car placed in the target scene with a
 *           generic person standing next to it in a specified pose
 *
 *   Why this works: single-image Kontext is the strongest car
 *   preservation we have. No competing reference image to dilute
 *   the model's attention.
 *
 * Step 2 — Face Swap:
 *   Input: user's face photo + step-1 image
 *   Output: step-1 image with the generic face replaced by the user's
 *
 *   Why this works: dedicated face-swap models do ONE job — copy
 *   the identity from a source face onto a target face. Pixel-level
 *   identity preservation is their entire purpose.
 *
 * Each step is single-purpose, so neither has to compromise.
 *
 * The genType.metadata fields drive the prompts:
 *   kontextPrompt: step 1 scene + person pose description
 *   (face swap doesn't need a prompt)
 */
async function runKontextThenFaceSwapPipeline(
  genType: typeof generationTypes.$inferSelect,
  inputBase64: string,
  inputBase64_2: string | undefined,
  apiKey: string
): Promise<{ images?: { url: string }[] }> {
  if (!inputBase64_2) {
    throw new Error("This generation type requires both a person photo and a car photo.");
  }

  const meta = (genType.metadata ?? {}) as Record<string, unknown>;
  let kontextPrompt = (meta.kontextPrompt as string) ?? genType.prompt;

  const faceDataUri = `data:image/jpeg;base64,${inputBase64}`;
  const carDataUri = `data:image/jpeg;base64,${inputBase64_2}`;

  // ── Step 0a: Detect face attributes (gender, age, ethnicity, hair).
  // The closer the kontext placeholder person looks to the user, the
  // better the face-swap result. Generic placeholder + cross-ethnicity
  // swap is what causes "doesn't look like me" results.
  const attrs = await detectFaceAttributes(faceDataUri, apiKey);
  const gender = attrs.gender;
  const subject =
    gender === "female" ? "woman" :
    gender === "male"   ? "man" :
    "adult person";
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1);

  // Build a descriptor like "young adult caucasian woman with long brown hair"
  const ageDesc = attrs.age ?? "young adult";
  const ethnicityDesc = attrs.ethnicity ? `${attrs.ethnicity} ` : "";
  const hairDesc = attrs.hair ? ` with ${attrs.hair}` : "";
  const personDescriptor = `${ageDesc} ${ethnicityDesc}${subject}${hairDesc}`;
  const PersonDescriptor =
    personDescriptor.charAt(0).toUpperCase() + personDescriptor.slice(1);

  // Build outfit + accessory descriptors for the prompt
  const outfitDesc = attrs.outfit ?? "casual top";
  const accessoriesDesc = attrs.accessories ?? "";
  const hairFull = attrs.hair ?? "natural hair";

  // Substitute placeholders in the per-type kontext prompt
  kontextPrompt = kontextPrompt
    .replace(/\{personDescriptor\}/g, personDescriptor)
    .replace(/\{PersonDescriptor\}/g, PersonDescriptor)
    .replace(/\{subject\}/g, subject)
    .replace(/\{Subject\}/g, Subject)
    .replace(/\{outfit\}/g, outfitDesc)
    .replace(/\{hair\}/g, hairFull)
    .replace(/\{accessories\}/g, accessoriesDesc);

  // ── Build the FINAL prompt with critical rules at the START ──
  // Diffusion model attention is biased toward early tokens, so we put
  // the most important rules (car preservation, person identity, anti-
  // duplication, anti-AI) at the front of the prompt.
  const criticalPrefix =
    `PHOTOREAL EDITORIAL PHOTOGRAPH. Single ${subject}, single car. ` +
    `Person: ${personDescriptor}` +
    (attrs.outfit ? `, wearing ${attrs.outfit}` : "") +
    (attrs.accessories ? `, with ${attrs.accessories}` : "") +
    `. CAR MUST BE PIXEL-IDENTICAL to the input car photo: same make, model, year, exact ` +
    `paint colour, wheels, rims, badges and brand emblems, license plate text and font, ` +
    `headlights, grille, every panel line. Do NOT substitute the brand. Do NOT change the plate. ` +
    `STRICTLY one ${subject} and one car in the entire frame, no duplicates, no extras, ` +
    `no reflected duplicates. Person's face is unobstructed, turned toward the camera, ` +
    `well-lit, with photoreal skin (visible pores, slight asymmetry, real human texture, ` +
    `not airbrushed, not plastic). Correct anatomy, well-defined hands, no warped fingers. ` +
    `Balanced composition: car and person equal visual weight, both razor-sharp at f/5.6 ` +
    `deep depth of field. ──── SCENE: `;

  const qualitySuffix =
    " Photoreal magazine quality, captured on a real camera, single moment, no HDR, " +
    "no oversharpening, no AI artifacts, no warped anatomy, no extra subjects.";

  kontextPrompt = criticalPrefix + kontextPrompt + qualitySuffix;

  console.log(
    `[pipeline] attrs: gender=${gender ?? "?"} age=${attrs.age ?? "?"} ` +
    `ethnicity=${attrs.ethnicity ?? "?"} hair=${attrs.hair ?? "?"}`
  );

  // (Step 0b removed: pre-enhancing the source face was making the
  //  enhanced face mismatch the kontext-generated lighting, hurting
  //  blend quality. The post-restoration step below handles polish.)
  const enhancedFaceUri = faceDataUri;

  // ── Step 1: Kontext places the EXACT car in scene with a placeholder person ──
  // Higher inference steps = sharper car body lines, sharper background,
  // and a more detailed placeholder body (which face-swap then refines).
  const step1Body = {
    prompt: kontextPrompt,
    image_url: carDataUri,
    guidance_scale: 3.0,
    num_inference_steps: 50,
    num_images: 1,
    safety_tolerance: "2",
    output_format: "jpeg",
    aspect_ratio: "16:9",
  };

  const step1 = await callFal(
    "fal-ai/flux-pro/kontext/max",
    step1Body,
    apiKey
  );
  const step1Url = step1.images?.[0]?.url;
  if (!step1Url) {
    throw new Error("Kontext step did not return an image");
  }

  // ── Step 2: Face swap — replace generic face with user's face ──
  // Tries multiple FAL face-swap endpoints in order until one returns
  // a valid swapped image. Then runs face restoration as a polish step.

  type SwapAttempt = {
    name: string;
    model: string;
    body: Record<string, unknown>;
  };

  const attempts: SwapAttempt[] = [
    // Basic FAL face swap (known working — InsightFace-based)
    {
      name: "fal-base-swap",
      model: "fal-ai/face-swap",
      body: {
        base_image_url: step1Url,
        swap_image_url: enhancedFaceUri,
      },
    },
    // Easel AI advanced face swap with user's hair preserved
    {
      name: "easel-advanced-userhair",
      model: "easel-ai/advanced-face-swap",
      body: {
        face_image_0: enhancedFaceUri,
        gender_0: gender ?? "male",
        target_image: step1Url,
        workflow_type: "user_hair",
      },
    },
    // Easel AI advanced face swap (gender format 2 — capital first)
    {
      name: "easel-advanced-cap",
      model: "easel-ai/advanced-face-swap",
      body: {
        face_image_0: enhancedFaceUri,
        gender_0: gender === "female" ? "Female" : "Male",
        target_image: step1Url,
      },
    },
  ];

  let swapResult: { images: { url: string }[] } | null = null;
  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      console.log(`[face-swap] trying ${attempt.name} (${attempt.model})`);
      const res = await callFal(attempt.model, attempt.body, apiKey);
      const normalised = normaliseFaceSwapResult(res);
      if (normalised) {
        console.log(`[face-swap] ✓ ${attempt.name} succeeded`);
        swapResult = normalised;
        break;
      }
      console.warn(
        `[face-swap] ${attempt.name} returned no image. Keys: ${Object.keys(res).join(", ")}`
      );
    } catch (err) {
      lastError = err;
      console.warn(`[face-swap] ${attempt.name} failed:`, (err as Error).message);
    }
  }

  if (!swapResult) {
    throw new Error(
      `All face swap attempts failed. Last error: ${(lastError as Error)?.message ?? "unknown"}`
    );
  }

  // ── Step 3: Face restoration polish ──
  // Run CodeFormer / GFPGAN on the swapped image to sharpen facial features.
  const swappedUrl = swapResult.images[0].url;

  type RestoreAttempt = { name: string; model: string; body: Record<string, unknown> };
  const restoreAttempts: RestoreAttempt[] = [
    {
      name: "codeformer",
      model: "fal-ai/codeformer",
      // No upscaling (1×) — keeps the whole image at native resolution
      // so the car, body, and background stay equally sharp.
      // background_enhance + face_upsample false = uniform enhancement
      // across the whole frame instead of focusing only on the face.
      body: {
        image_url: swappedUrl,
        fidelity: 0.85,
        upscaling: 1,
        face_upsample: false,
        background_enhance: true,
      },
    },
    {
      name: "gfpgan",
      model: "fal-ai/gfpgan",
      body: { image_url: swappedUrl, upscaling_factor: 1 },
    },
    {
      name: "face-upsampler",
      model: "fal-ai/face-upsampler",
      body: { image_url: swappedUrl },
    },
  ];

  let restoredResult: { images: { url: string }[] } = swapResult;
  for (const r of restoreAttempts) {
    try {
      console.log(`[face-restore] trying ${r.name} (${r.model})`);
      const restored = await callFal(r.model, r.body, apiKey);
      const restoredNorm = normaliseFaceSwapResult(restored);
      if (restoredNorm) {
        console.log(`[face-restore] ✓ ${r.name} succeeded`);
        restoredResult = restoredNorm;
        break;
      }
    } catch (err) {
      console.warn(`[face-restore] ${r.name} failed:`, (err as Error).message);
    }
  }
  if (restoredResult === swapResult) {
    console.warn("[face-restore] all restoration attempts failed, using unrestored swap");
  }

  // ── Step 4: Final super-resolution upscale ──
  // Run a real-world super-resolution model to bump the output to a
  // higher resolution with photo-realistic detail recovery. This is
  // what gives the final image a "professional photograph" look
  // instead of an AI-generated feel.
  const restoredUrl = restoredResult.images[0].url;

  type UpscaleAttempt = { name: string; model: string; body: Record<string, unknown> };
  const upscaleAttempts: UpscaleAttempt[] = [
    {
      name: "aura-sr",
      model: "fal-ai/aura-sr",
      body: { image_url: restoredUrl, upscaling_factor: 2 },
    },
    {
      name: "clarity-upscaler",
      model: "fal-ai/clarity-upscaler",
      body: { image_url: restoredUrl, upscale_factor: 2, creativity: 0.3, resemblance: 0.6 },
    },
    {
      name: "ccsr",
      model: "fal-ai/ccsr",
      body: { image_url: restoredUrl, scale: 2 },
    },
  ];

  for (const u of upscaleAttempts) {
    try {
      console.log(`[upscale] trying ${u.name} (${u.model})`);
      const upscaled = await callFal(u.model, u.body, apiKey);
      const upscaledNorm = normaliseFaceSwapResult(upscaled);
      if (upscaledNorm) {
        console.log(`[upscale] ✓ ${u.name} succeeded`);
        return upscaledNorm;
      }
    } catch (err) {
      console.warn(`[upscale] ${u.name} failed:`, (err as Error).message);
    }
  }

  console.warn("[upscale] all upscale attempts failed, returning restored result");
  return restoredResult;
}

function normaliseFaceSwapResult(
  res: Record<string, unknown>
): { images: { url: string }[] } | null {
  // Standard FAL shape
  const images = (res as { images?: { url: string }[] }).images;
  if (images?.[0]?.url) return { images };

  // Some endpoints return { image: { url } }
  const image = (res as { image?: { url?: string } }).image;
  if (image?.url) return { images: [{ url: image.url }] };

  // Some return { output: "url" }
  const output = (res as { output?: unknown }).output;
  if (typeof output === "string") return { images: [{ url: output }] };

  // Some return { swapped_image: { url } }
  const swapped = (res as { swapped_image?: { url?: string } }).swapped_image;
  if (swapped?.url) return { images: [{ url: swapped.url }] };

  return null;
}

/**
 * (Legacy) Two-step IP-adapter pipeline for "person + car" generations.
 *
 * Step 1: FLUX PuLID with face IP-adapter
 * Step 2: FLUX Kontext Multi
 *
 * Kept for backwards compatibility with any types still using this
 * pipeline. New types should prefer `kontext_then_faceswap`.
 */
async function runPulidThenKontextPipeline(
  genType: typeof generationTypes.$inferSelect,
  inputBase64: string,
  inputBase64_2: string | undefined,
  apiKey: string
): Promise<{ images?: { url: string }[] }> {
  if (!inputBase64_2) {
    throw new Error("This generation type requires both a person photo and a car photo.");
  }

  const meta = (genType.metadata ?? {}) as Record<string, unknown>;
  const pulidPrompt = (meta.pulidPrompt as string) ?? genType.prompt;
  const kontextPrompt = (meta.kontextPrompt as string) ?? genType.prompt;

  const faceDataUri = `data:image/jpeg;base64,${inputBase64}`;
  const carDataUri = `data:image/jpeg;base64,${inputBase64_2}`;

  // ── Step 1: PuLID generates person + placeholder car in scene ──
  // Note: id_weight must be ≤ 1.0 (FAL validation). 1.0 = maximum
  // identity preservation strength.
  const step1Body = {
    prompt: pulidPrompt,
    reference_image_url: faceDataUri,
    image_size: "landscape_16_9",
    num_inference_steps: 25,
    guidance_scale: 4,
    id_weight: 1.0,
    output_format: "jpeg",
    true_cfg: 1.5,
    max_sequence_length: 256,
  };

  const step1 = await callFal("fal-ai/flux-pulid", step1Body, apiKey);
  const step1Url = step1.images?.[0]?.url;
  if (!step1Url) {
    throw new Error("PuLID step did not return an image");
  }

  // ── Step 2: Kontext Multi swaps the placeholder car for the real one ──
  const step2Body = {
    prompt: kontextPrompt,
    image_urls: [step1Url, carDataUri],
    guidance_scale: 2.5,
    num_inference_steps: 40,
    num_images: 1,
    safety_tolerance: "2",
    output_format: "jpeg",
    aspect_ratio: "16:9",
  };

  const step2 = await callFal(
    "fal-ai/flux-pro/kontext/max/multi",
    step2Body,
    apiKey
  );

  return step2;
}

function buildFalRequestBody(
  genType: typeof generationTypes.$inferSelect,
  inputBase64: string,
  inputBase64_2?: string
) {
  const dataUri = `data:image/jpeg;base64,${inputBase64}`;
  const model = genType.falModel;

  let body: Record<string, unknown>;

  if (model.includes("nano-banana")) {
    // Google Nano Banana 2 — instructed image editing with multi-image
    // support. Single-shot person + car composite. Excellent identity
    // and detail preservation built into the model itself.
    const dataUri2 = inputBase64_2
      ? `data:image/jpeg;base64,${inputBase64_2}`
      : null;
    body = {
      prompt: genType.prompt,
      image_urls: dataUri2 ? [dataUri, dataUri2] : [dataUri],
      num_images: 1,
      output_format: "jpeg",
    };
  } else if (model.includes("kontext") && model.includes("multi")) {
    // FLUX Kontext Multi: instructed editing with TWO reference images.
    // Preserves both the person's face AND the car (body, paint, plate)
    // while composing them into a new scene per the prompt.
    //
    // The "max" variant (fal-ai/flux-pro/kontext/max/multi) is tuned for
    // identity preservation — uses lower guidance + more inference steps
    // to better adhere to the reference images.
    const isMaxVariant = model.includes("/max/") || model.includes("max-multi");
    const dataUri2 = inputBase64_2
      ? `data:image/jpeg;base64,${inputBase64_2}`
      : null;
    body = {
      prompt: genType.prompt,
      image_urls: dataUri2 ? [dataUri, dataUri2] : [dataUri],
      guidance_scale: isMaxVariant ? 2.5 : 3.5,
      num_inference_steps: isMaxVariant ? 40 : 28,
      num_images: 1,
      safety_tolerance: "2",
      output_format: "jpeg",
      aspect_ratio: "16:9",
    };
  } else if (model.includes("kontext")) {
    // FLUX Kontext: instructed image editing — preserves the subject
    // (car body, license plate, paint, badges) and only modifies the
    // scene/background as instructed by the prompt.
    body = {
      prompt: genType.prompt,
      image_url: dataUri,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      num_images: 1,
      safety_tolerance: "2",
      output_format: "jpeg",
      aspect_ratio: "16:9",
    };
  } else if (model.includes("flux/dev/image-to-image") || model.includes("flux-lora/image-to-image")) {
    // General-purpose image-to-image (cars, objects, scenes)
    body = {
      prompt: genType.prompt,
      image_url: dataUri,
      strength: 0.85,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      image_size: "landscape_16_9",
      output_format: "jpeg",
    };
  } else if (model.includes("sadtalker")) {
    // SadTalker: talking head / singing
    // driven_audio_url should be set in generation type metadata
    body = {
      source_image_url: dataUri,
      driven_audio_url: genType.metadata?.driven_audio_url as string ??
        "https://pub-d65eb71ee06645b9980c1153ca5a5250.r2.dev/samples/sadtalker_audio.wav",
      still_mode: false,
      face_model_resolution: "512",
      expression_scale: 1.0,
      preprocess: "crop",
    };
  } else if (model.includes("live-portrait")) {
    // Live Portrait: dance, wink, aging video
    // video_url should be set in generation type metadata
    body = {
      image_url: dataUri,
      video_url: genType.metadata?.video_url as string ??
        "https://pub-d65eb71ee06645b9980c1153ca5a5250.r2.dev/samples/liveportrait_driving.mp4",
      live_portrait_dsize: 512,
      live_portrait_scale: 2.3,
      video_select_every_n_frames: 1,
    };
  } else {
    // Default: flux-pulid and other image models
    body = {
      prompt: genType.prompt,
      reference_image_url: dataUri,
      guidance_scale: 4,
      num_inference_steps: 20,
      image_size: "square_hd",
      output_format: "jpeg",
      id_weight: 1.0,
    };

    if (genType.inputMode === "twoPhotos" && inputBase64_2) {
      body.reference_image_url_2 = `data:image/jpeg;base64,${inputBase64_2}`;
    }
  }

  // Apply type-specific metadata overrides
  if (genType.metadata) {
    Object.assign(body, genType.metadata);
  }

  return body;
}

async function getSettingValue(key: string): Promise<string | null> {
  const { appSettings } = await import("../../db/schema.js");
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return row?.value ?? null;
}

export default gens;
