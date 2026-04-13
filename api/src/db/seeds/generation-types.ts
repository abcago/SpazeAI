/**
 * Generation Types Seed Data
 * ────────────────────────────────────────────────────────────
 * Single source of truth for all generation types.
 * Used by:
 *   - npm run db:seed              → full database seed
 *   - npm run db:seed:gen-types    → only seed/upsert generation types
 *
 * Safe to run on production: uses ON CONFLICT DO NOTHING.
 */

export type GenerationTypeSeed = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  prompt: string;
  coinCost: number;
  estimatedSeconds: number;
  sortOrder: number;
  inputMode?: "singlePhoto" | "twoPhotos";
  falModel?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

export const generationTypesSeed: GenerationTypeSeed[] = [
  // ─── Product Wizard (top-level featured) ────────────────
  // Single-photo flow: user uploads ONE product image, the wizard
  // auto-detects what it is via VQA, then picks the best marketing
  // template for that product type and generates a polished intro
  // image (sometimes with a model, sometimes product-only).
  { id: "product_wizard", name: "Product Wizard", description: "Upload any product — we'll create the perfect marketing shot", icon: "🪄", category: "wizard",
    falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      pipeline: "product_wizard",
      photo1Label: "Product Photo",
      photo1Icon: "shippingbox.fill",
    },
    prompt: "Auto-generated based on detected product type. See pipeline for details.",
    coinCost: 8, estimatedSeconds: 90, sortOrder: 0 },

  // ─── Trending ───────────────────────────────────────────
  { id: "baby_version", name: "Baby Version", description: "See how you looked as a baby", icon: "👶", category: "trending",
    prompt: "Photorealistic portrait of this person as an adorable real baby, real infant photograph, natural skin, soft baby features, studio photo, DSLR quality, real life baby",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 1 },
  { id: "old_age", name: "Old Age", description: "See yourself in old age", icon: "👴", category: "trending",
    prompt: "Photorealistic portrait of this person aged 30 years older, elderly, natural wrinkles, grey hair, age spots, real photograph, DSLR quality, natural lighting",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 2 },
  { id: "gender_swap", name: "Gender Swap", description: "See yourself as opposite gender", icon: "🔄", category: "trending",
    prompt: "Photorealistic portrait of this person as the opposite gender, real photograph, studio lighting, DSLR quality, natural look",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 3 },
  { id: "parent_baby", name: "Parent Baby", description: "See what your baby would look like", icon: "👨‍👩‍👦", category: "trending", inputMode: "twoPhotos",
    prompt: "Photorealistic portrait of this person as an adorable real baby, real infant photograph, natural skin, soft baby features, studio photo, DSLR quality, real life baby",
    coinCost: 4, estimatedSeconds: 60, sortOrder: 4 },

  // ─── Realistic ──────────────────────────────────────────
  { id: "young_version", name: "Young Version", description: "See yourself younger", icon: "🧒", category: "realistic",
    prompt: "Photorealistic portrait of this person 20 years younger, youthful smooth skin, teenager, real photograph, DSLR quality, natural lighting",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 10 },
  { id: "glamour", name: "Glamour", description: "Hollywood glamour shot", icon: "✨", category: "realistic",
    prompt: "Professional glamour photography portrait, perfect studio lighting, beauty retouching, magazine cover quality, real photograph, DSLR, flawless skin",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 11 },
  { id: "linkedin_corporate", name: "LinkedIn Pro", description: "Professional corporate headshot", icon: "💼", category: "realistic",
    prompt: "Ultra realistic professional corporate LinkedIn headshot of this person, wearing a tailored modern business suit (charcoal gray or navy blue blazer with crisp white dress shirt), confident friendly smile, direct eye contact with camera, soft natural office lighting from a large window, slightly blurred modern corporate office background with subtle bokeh, shot on Canon EOS R5 with 85mm f/1.4 lens, shallow depth of field, sharp focus on the eyes, professional color grading, neutral skin tones, well-groomed hair, natural makeup, premium business portrait, magazine-quality executive photography, clean and polished look, approachable yet authoritative demeanor, high resolution photorealistic, DSLR studio quality, no filters, 4K detail",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 12 },
  { id: "passport_photo", name: "Passport Photo", description: "Official ID style photo", icon: "🪪", category: "realistic",
    prompt: "Official passport photograph of this person, plain white background, neutral facial expression, looking directly at camera, even diffused lighting from front, no shadows on face, head and top of shoulders visible, photorealistic, sharp focus, ID photo standards compliant",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 13 },
  { id: "fitness_model", name: "Fitness Model", description: "Athletic magazine shoot", icon: "💪", category: "realistic",
    prompt: "Photorealistic athletic fitness model portrait of this person, fully dressed in branded sportswear (a fitted athletic compression t-shirt and athletic shorts or training pants, full coverage activewear), modern gym setting with workout equipment, dramatic side lighting, focused determined expression, holding a water bottle or towel, magazine-quality sports photography, shot with 70-200mm lens, shallow depth of field, premium fitness brand campaign aesthetic, Nike Adidas Under Armour style ad, head and upper body framing, professional editorial sports fashion shoot, modest tasteful athletic apparel",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 14 },

  // ─── Artistic ───────────────────────────────────────────
  { id: "cartoon", name: "Cartoon", description: "Disney/Pixar cartoon style", icon: "🎨", category: "artistic",
    prompt: "Disney Pixar cartoon character portrait, 3D animated style, expressive eyes, colorful, family friendly",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 20 },
  { id: "anime", name: "Anime", description: "Japanese anime style", icon: "🎌", category: "artistic",
    prompt: "Anime style portrait, Japanese animation art style, vibrant colors, detailed eyes, clean linework",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 21 },
  { id: "3d_character", name: "3D Character", description: "3D rendered character", icon: "🧊", category: "artistic",
    prompt: "3D animated character portrait, Pixar Disney style, smooth render, vibrant lighting",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 22 },
  { id: "pixel_art", name: "Pixel Art", description: "Retro pixel art style", icon: "👾", category: "artistic",
    prompt: "Retro pixel art portrait, 16-bit style, pixelated, vibrant colors, game character",
    coinCost: 2, estimatedSeconds: 20, sortOrder: 23 },
  { id: "pop_art", name: "Pop Art", description: "Andy Warhol pop art", icon: "🎭", category: "artistic",
    prompt: "Andy Warhol pop art style portrait, bold bright colors, screen print effect, high contrast",
    coinCost: 2, estimatedSeconds: 20, sortOrder: 24 },
  { id: "ghibli", name: "Studio Ghibli", description: "Hayao Miyazaki anime style", icon: "🌸", category: "artistic",
    prompt: "Studio Ghibli Hayao Miyazaki anime portrait, soft watercolor backgrounds, hand-painted aesthetic, warm whimsical colors, gentle expressive eyes, detailed nature elements, dreamy atmospheric lighting, Spirited Away and Howl's Moving Castle visual style",
    coinCost: 3, estimatedSeconds: 28, sortOrder: 25 },
  { id: "comic_book", name: "Comic Book", description: "Marvel comic book hero", icon: "💥", category: "artistic",
    prompt: "Marvel comic book illustration style portrait, bold ink outlines, halftone shading dots, dramatic action lighting, vibrant primary colors, dynamic composition, classic superhero comic book art aesthetic, Stan Lee era inspired",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 26 },
  { id: "graffiti", name: "Graffiti Art", description: "Street art spray paint", icon: "🎨", category: "artistic",
    prompt: "Urban graffiti street art portrait, spray paint texture on concrete brick wall, bold neon colors, dripping paint effects, stencil and freehand mix, Banksy and Basquiat inspired, gritty urban backdrop, dynamic graffiti tags around face",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 27 },
  { id: "vaporwave", name: "Vaporwave", description: "80s retro neon aesthetic", icon: "🌴", category: "artistic",
    prompt: "Vaporwave aesthetic portrait, neon pink and cyan synthwave colors, 80s retro futurism, gridded sunset background, glitch effects, palm trees silhouettes, chrome highlights, dreamy nostalgic vibe, Miami Vice inspired",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 28 },
  { id: "low_poly", name: "Low Poly", description: "Geometric low poly 3D", icon: "🔷", category: "artistic",
    prompt: "Low poly 3D geometric art portrait, faceted triangular polygons, flat shaded surfaces, vibrant gradient colors, minimalist modern style, clean isometric rendering, contemporary digital art aesthetic",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 29 },
  { id: "vector_art", name: "Vector Art", description: "Flat illustration style", icon: "📐", category: "artistic",
    prompt: "Modern flat vector illustration portrait, clean bold outlines, simplified geometric shapes, flat solid colors with subtle gradients, minimalist contemporary design style, perfect for tech branding, Adobe Illustrator aesthetic",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 30 },
  { id: "manga_bw", name: "Manga (B&W)", description: "Black and white manga panel", icon: "📖", category: "artistic",
    prompt: "Black and white Japanese manga portrait, traditional ink linework, screentone shading patterns, dramatic crosshatching, expressive shoujo or shounen manga eyes, detailed hair lines, Naruto and Attack on Titan inspired aesthetic, panel-ready manga illustration",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 31 },
  { id: "chibi", name: "Chibi Style", description: "Cute super-deformed mini", icon: "🥰", category: "artistic",
    prompt: "Cute chibi style portrait, super-deformed proportions with oversized head, big sparkling expressive eyes, tiny body, kawaii Japanese aesthetic, soft pastel colors, simple clean linework, adorable mascot character design",
    coinCost: 2, estimatedSeconds: 20, sortOrder: 32 },
  { id: "caricature", name: "Caricature", description: "Exaggerated funny portrait", icon: "😄", category: "artistic",
    prompt: "Hand-drawn caricature portrait, exaggerated facial features (oversized head, big smile, distinctive nose), playful humorous expression, vibrant watercolor and ink style, professional street artist quality, lively cartoonish charm",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 33 },
  { id: "stained_glass", name: "Stained Glass", description: "Cathedral window art", icon: "⛪", category: "artistic",
    prompt: "Medieval stained glass window portrait, segmented colored glass pieces with black lead lines, jewel-toned vibrant colors (ruby red, sapphire blue, emerald green, gold), backlit luminous effect, gothic cathedral religious art style, sacred geometry borders",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 34 },
  { id: "mosaic", name: "Mosaic Tiles", description: "Roman mosaic tile art", icon: "🟦", category: "artistic",
    prompt: "Ancient Roman mosaic portrait, small square ceramic and stone tiles (tesserae), earthy color palette with gold accents, classical Mediterranean style, intricate tile work, museum-quality artisan craftsmanship, Byzantine inspired",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 35 },
  { id: "tattoo_design", name: "Tattoo Style", description: "Traditional tattoo art", icon: "🖋️", category: "artistic",
    prompt: "Traditional American old school tattoo portrait, bold black outlines, limited color palette (red, green, yellow, blue), classic Sailor Jerry style, banners and decorative elements, clean vintage tattoo flash art aesthetic",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 36 },

  // ─── Classic Art ────────────────────────────────────────
  { id: "oil_painting", name: "Oil Painting", description: "Classic oil painting", icon: "🖼️", category: "classic_art",
    prompt: "Classical oil painting portrait, rich colors, museum quality, Renaissance master style, canvas texture",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 40 },
  { id: "watercolor", name: "Watercolor", description: "Watercolor painting", icon: "💧", category: "classic_art",
    prompt: "Watercolor painting portrait, soft brushstrokes, artistic, delicate colors, paper texture",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 41 },
  { id: "pencil_sketch", name: "Pencil Sketch", description: "Hand-drawn pencil sketch", icon: "✏️", category: "classic_art",
    prompt: "Detailed pencil sketch portrait, hand-drawn, graphite on paper, realistic shading, black and white",
    coinCost: 2, estimatedSeconds: 20, sortOrder: 42 },
  { id: "renaissance", name: "Renaissance", description: "Renaissance era portrait", icon: "👑", category: "classic_art",
    prompt: "Renaissance oil painting portrait, 16th century Italian master style, ornate clothing, golden frame, museum quality",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 43 },
  { id: "impressionist", name: "Impressionist", description: "Monet impressionist style", icon: "🌻", category: "classic_art",
    prompt: "Impressionist oil painting portrait in the style of Claude Monet and Renoir, visible loose brushstrokes, soft natural light, dappled colors, en plein air aesthetic, late 1800s French impressionism, dreamy garden atmosphere",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 44 },
  { id: "cubist", name: "Cubist", description: "Picasso cubism", icon: "🔺", category: "classic_art",
    prompt: "Cubist portrait in the style of Pablo Picasso, fragmented geometric facets, multiple perspectives shown simultaneously, abstract angular features, muted earth tones with bold accents, Les Demoiselles d'Avignon era, modernist masterpiece",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 45 },
  { id: "art_nouveau", name: "Art Nouveau", description: "Mucha decorative style", icon: "🌺", category: "classic_art",
    prompt: "Art Nouveau portrait in the style of Alphonse Mucha, ornate floral decorative borders, flowing organic lines, soft pastel colors, elegant flowing hair, halo or arch backdrop, late 19th century Belle Époque French aesthetic, decorative poster art",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 46 },
  { id: "ukiyo_e", name: "Ukiyo-e", description: "Japanese woodblock print", icon: "🗾", category: "classic_art",
    prompt: "Traditional Japanese ukiyo-e woodblock print portrait, in the style of Hokusai and Utamaro, flat bold colors, elegant black outlines, kimono and traditional Japanese clothing, Mount Fuji or cherry blossom background, Edo period aesthetic, museum-quality print",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 47 },
  { id: "charcoal", name: "Charcoal Sketch", description: "Dramatic charcoal drawing", icon: "🖤", category: "classic_art",
    prompt: "Dramatic black charcoal portrait sketch, rich dark tones, bold smudged shading, expressive rough strokes, fine art academy style, paper texture visible, classical figure drawing, atmospheric chiaroscuro lighting",
    coinCost: 2, estimatedSeconds: 22, sortOrder: 48 },
  { id: "surrealist", name: "Surrealist", description: "Salvador Dali surrealism", icon: "🎯", category: "classic_art",
    prompt: "Surrealist portrait in the style of Salvador Dali and René Magritte, dreamlike impossible elements, melting forms, floating objects, vast desert horizons, philosophical symbolism, hyper-detailed oil painting technique, mysterious atmospheric mood",
    coinCost: 3, estimatedSeconds: 28, sortOrder: 49 },
  { id: "baroque", name: "Baroque", description: "Caravaggio dramatic light", icon: "🕯️", category: "classic_art",
    prompt: "Baroque oil painting portrait in the style of Caravaggio and Rembrandt, dramatic chiaroscuro lighting with deep shadows, rich dark backgrounds, candlelit warm tones, ornate period clothing, museum masterpiece, 17th century Dutch Golden Age aesthetic",
    coinCost: 3, estimatedSeconds: 28, sortOrder: 50 },

  // ─── Fantasy ────────────────────────────────────────────
  { id: "superhero", name: "Superhero", description: "Your superhero version", icon: "🦸", category: "fantasy",
    prompt: "Epic superhero portrait with cape, heroic pose, dramatic cinematic lighting, comic book style costume",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 60 },
  { id: "fantasy_elf", name: "Fantasy Elf", description: "Middle-earth elf", icon: "🧝", category: "fantasy",
    prompt: "Fantasy elf portrait, pointed ears, ethereal glow, magical forest background, Lord of the Rings style",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 61 },
  { id: "cyberpunk", name: "Cyberpunk", description: "Futuristic cyberpunk style", icon: "🤖", category: "fantasy",
    prompt: "Cyberpunk portrait, neon lights, futuristic city background, cyber implants, holographic elements, sci-fi",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 62 },
  { id: "viking", name: "Viking", description: "Norse viking warrior", icon: "⚔️", category: "fantasy",
    prompt: "Norse Viking warrior portrait, braided hair, fur armor, battle-scarred, epic background, cinematic",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 63 },
  { id: "astronaut", name: "Astronaut", description: "Astronaut in space", icon: "🚀", category: "fantasy",
    prompt: "Astronaut in NASA space suit, space station background, Earth visible through window, photorealistic, cinematic",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 64 },
  { id: "steampunk", name: "Steampunk", description: "Victorian steampunk inventor", icon: "⚙️", category: "fantasy",
    prompt: "Victorian steampunk portrait, brass goggles and clockwork gears, leather aviator jacket, steam-powered mechanical accessories, aged sepia tones, industrial revolution aesthetic, intricate mechanical details, antique brass and copper textures",
    coinCost: 3, estimatedSeconds: 28, sortOrder: 65 },
  { id: "wizard", name: "Wizard", description: "Powerful magical wizard", icon: "🧙", category: "fantasy",
    prompt: "Powerful fantasy wizard portrait, long flowing robes, glowing magical staff, mystical aura with floating runes, ancient spell book, dramatic chiaroscuro lighting, Harry Potter and Lord of the Rings inspired, epic fantasy art",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 66 },
  { id: "samurai", name: "Samurai", description: "Feudal Japanese warrior", icon: "🗡️", category: "fantasy",
    prompt: "Honorable feudal Japanese samurai warrior portrait, traditional armor with intricate details, katana sword, cherry blossom petals falling, misty mountain background, historically accurate Edo period aesthetic, dramatic cinematic lighting",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 67 },
  { id: "pirate", name: "Pirate", description: "Caribbean pirate captain", icon: "🏴‍☠️", category: "fantasy",
    prompt: "Swashbuckling Caribbean pirate captain portrait, weathered leather coat with tricorn hat, golden treasure jewelry, ship deck background with stormy seas, Pirates of the Caribbean aesthetic, dramatic ocean lighting, adventurous expression",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 68 },
  { id: "mermaid", name: "Mermaid", description: "Underwater mermaid", icon: "🧜", category: "fantasy",
    prompt: "Mystical underwater mermaid portrait, iridescent fish scales, flowing aquatic hair, glowing bioluminescent jewelry, coral reef background with sunbeams, ethereal turquoise lighting, fantasy ocean kingdom aesthetic",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 69 },
  { id: "vampire", name: "Vampire", description: "Gothic vampire lord", icon: "🧛", category: "fantasy",
    prompt: "Gothic vampire lord portrait, pale porcelain skin with subtle fangs, deep red eyes, elegant Victorian aristocrat clothing, blood red velvet cape, candlelit dark castle background, mysterious seductive atmosphere, Bram Stoker Dracula aesthetic",
    coinCost: 3, estimatedSeconds: 30, sortOrder: 70 },
  { id: "zombie", name: "Zombie", description: "Zombie transformation", icon: "🧟", category: "fantasy",
    prompt: "Zombie horror portrait, decaying skin, undead, scary, dark atmosphere, horror movie style",
    coinCost: 2, estimatedSeconds: 25, sortOrder: 71, isActive: false },

  // ─── Car Photography ────────────────────────────────────
  // All car types use FLUX Kontext (instructed image editing) so the
  // car body, paint color, license plate, badges, and wheels stay
  // EXACTLY as in the input photo. Only the background and lighting
  // are modified per the prompt instructions.
  { id: "car_showroom", name: "Showroom Luxury", description: "Polished dealership showroom", icon: "🏎️", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint color, wheels, badges, license plate and all details unchanged. Only replace the background with a luxury automotive showroom: polished marble floor with mirror-like reflections beneath the car, dramatic overhead spotlights, soft ambient backlighting, premium dealership setting. Add a subtle glossy shine to the existing paint highlights. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 90 },
  { id: "car_mountain_sunset", name: "Mountain Sunset", description: "Winding mountain road golden hour", icon: "🏔️", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a winding alpine mountain road at golden hour sunset, dramatic snowy peaks in the distance, warm orange light bathing the scene, lens flare from the setting sun. Cinematic Top Gear style. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 91 },
  { id: "car_racetrack", name: "Track Day", description: "Racing on a motorsport track", icon: "🏁", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate, all details unchanged. Replace only the background with a professional motorsport racetrack: red and white curbs, grandstands with blurred crowd, dramatic side lighting, atmospheric haze. Add subtle motion blur to the surroundings (NOT the car). Le Mans aesthetic. Do not modify the car.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 92 },
  { id: "car_beach_sunset", name: "Beach Sunset", description: "Tropical beach at golden hour", icon: "🏖️", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a tropical beach at sunset, palm trees silhouetted against an orange and pink sky, ocean waves in the distance, warm golden hour light. Add a soft warm sunset glow on the car's existing paint. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 93 },
  { id: "car_neon_night", name: "Neon City Night", description: "Urban street with neon lights", icon: "🌃", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a cyberpunk neon-lit city street at night: vibrant pink, purple and cyan neon signs, atmospheric fog and steam, wet pavement. Add neon color reflections playing across the existing car paint. Blade Runner 2049 aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 94 },
  { id: "car_rainy_night", name: "Rainy Reflections", description: "Wet asphalt with city lights", icon: "🌧️", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a rainy night street: wet glistening asphalt reflecting warm street lamp glow, atmospheric mist, soft bokeh of distant city lights. Add tiny rain droplets on the existing car body and a wet shimmer to the existing paint. Do not modify the car.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 95 },
  { id: "car_desert_dunes", name: "Sahara Dunes", description: "Driving across desert sand", icon: "🐫", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with vast Sahara desert sand dunes stretching to the horizon, golden warm sand, cloudless deep blue sky, harsh midday sunlight. Add a subtle dust haze around the wheels. Top Gear special episode aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 96 },
  { id: "car_winter_alpine", name: "Alpine Winter", description: "Snow-covered mountain road", icon: "❄️", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a snowy alpine road: snow-covered pine trees, fresh white snow on the ground, dramatic snow-capped mountain peaks in the distance, soft overcast winter light. Add a few snowflakes in the air. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 97 },
  { id: "car_forest_autumn", name: "Autumn Forest", description: "Fall foliage on a forest road", icon: "🍂", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a winding forest road in autumn: vibrant red, orange and yellow fall foliage, golden afternoon sunlight filtering through the leaves, fallen leaves scattered on the road, atmospheric haze. New England scenic drive aesthetic. Do not modify the car.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 98 },
  { id: "car_tokyo_neon", name: "Tokyo Street", description: "Neon-lit Tokyo backstreet", icon: "🏮", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a neon-lit Tokyo backstreet at night: Japanese kanji shop signs glowing pink red and blue, vending machines, narrow alley with wet pavement reflections, atmospheric fog. Initial D / Tokyo Drift JDM aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 99 },
  { id: "car_garage_workshop", name: "Garage Workshop", description: "Custom tuning shop", icon: "🔧", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a high-end custom tuning workshop garage: polished concrete floor, neon shop signs on the walls, tool chests, motorsport posters, dramatic overhead workshop lighting. Speedhunters editorial aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 100 },
  { id: "car_studio_black", name: "Studio Black", description: "Dramatic studio with black backdrop", icon: "📸", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a pure black studio backdrop. Add dramatic side lighting with crisp highlights tracing the existing body lines and curves. Polished glossy black floor with subtle reflection of the car beneath. Premium product photography. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 101 },
  { id: "car_drift_smoke", name: "Drift Smoke", description: "Sliding sideways with tire smoke", icon: "💨", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Add billowing white tire smoke around the rear wheels. Replace the background with a wide motorsport asphalt track with motion-blurred grandstands, dramatic afternoon side lighting. Formula Drift championship aesthetic. Do not modify the car itself, only add the smoke effect and change the background.",
    coinCost: 5, estimatedSeconds: 40, sortOrder: 102 },
  { id: "car_vintage_70s", name: "Vintage 70s", description: "Retro 70s film photography", icon: "📼", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint color, wheels, badges, license plate unchanged. Apply a 1970s Kodachrome film aesthetic: warm faded color grading, subtle film grain, light leaks, gentle sun flare. Replace the background with a period-accurate 70s American suburban street or coastal highway. Vintage car magazine ad style. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 103 },
  { id: "car_movie_poster", name: "Movie Poster", description: "Cinematic action movie poster", icon: "🎬", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a cinematic Hollywood action movie scene: explosive fire and smoke, dramatic moody lighting, lens flares, helicopters in the distance. Add an epic movie poster atmosphere around the car. Fast and Furious / Michael Bay aesthetic. Do not modify the car itself.",
    coinCost: 5, estimatedSeconds: 40, sortOrder: 104 },
  { id: "car_offroad_jungle", name: "Off-Road Jungle", description: "Muddy jungle expedition", icon: "🌴", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Add a light splatter of mud on the lower body and wheels. Replace the background with a dense tropical jungle off-road trail: muddy ground, lush green foliage, river crossing, atmospheric mist. Camel Trophy expedition aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 105 },
  { id: "car_salt_flats", name: "Salt Flats", description: "Bonneville speed run", icon: "🧂", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with the vast Bonneville salt flats: endless flat white cracked salt surface stretching to the horizon, distant mountain silhouettes, golden hour sunset light. Cinematic minimalist land speed record aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 106 },
  { id: "car_volcanic", name: "Volcanic Landscape", description: "Dramatic volcano backdrop", icon: "🌋", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a dramatic Iceland volcanic landscape: black volcanic rock terrain, geothermal steam vents, a distant volcano with glowing lava, moody overcast sky. Otherworldly premium luxury car ad aesthetic. Do not modify the car itself.",
    coinCost: 5, estimatedSeconds: 40, sortOrder: 107 },
  { id: "car_auto_show", name: "Auto Show", description: "Premium convention display", icon: "🎪", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with a premium auto show display: rotating glossy black platform beneath the car, dramatic colored concert beam lighting from above, blurred crowd of spectators in the distance. Geneva or Frankfurt Motor Show aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 108 },
  { id: "car_supercar_canyon", name: "Canyon Cruise", description: "Pacific Coast Highway scenic drive", icon: "🌅", category: "car",
    falModel: "fal-ai/flux-pro/kontext",
    prompt: "Keep the car exactly as it is — same body, paint, wheels, badges, license plate unchanged. Replace only the background with the Pacific Coast Highway: dramatic ocean cliffs to one side, blue Pacific Ocean below, golden California sunset light, lens flare. Smooth winding coastal road. Premium supercar magazine aesthetic. Do not modify the car itself.",
    coinCost: 4, estimatedSeconds: 35, sortOrder: 109 },

  // ─── You + Your Car (super realistic composite) ─────────
  // Dedicated category. Uses FLUX Kontext Multi (two reference
  // images). Preserves BOTH identities (face + car) and explicitly
  // forbids duplicate subjects (no two people, no two cars).
  // Image 1 = person photo, Image 2 = car photo
  //
  // Prompt engineering rules baked into every entry:
  //  • Hard "ONLY ONE person, ONLY ONE car" guarantees
  //  • Preservation instructions repeated 2-3×
  //  • Explicit anti-AI face descriptors (pores, asymmetry, no plastic)
  //  • Real camera + film stock references for photographic grounding
  // ── ALL "You & Your Car" types use Google Nano Banana 2 single-shot ──
  // Multi-image instructed editing handles person + car composition
  // in one model call. Built-in identity and detail preservation.

  // ── Magazine Cover Pro ──
  { id: "person_car_magazine_cover", name: "Magazine Cover Pro", description: "Premium magazine cover style", icon: "📰", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic premium automotive magazine cover featuring the EXACT person from image 1 standing beside the EXACT car from image 2. PERSON: preserve the same face, hair, skin tone, eye colour, and identifying features from image 1 with photographic accuracy. The person stands relaxed and confident at the front quarter panel of the car, body angled three-quarters toward the camera, face turned to camera with a natural expression, wearing the same outfit as in image 1 (or a clean smart-casual outfit if not visible). CAR: the car must be PIXEL-PERFECT identical to image 2 — same make, model, year, exact paint colour, every wheel and rim, all badges and brand emblems, the license plate readable and identical, headlights, grille, every panel line preserved unchanged. Do NOT redesign or restyle the car. SCENE: a polished studio environment with a clean dark gradient background, dramatic side lighting from a low key softbox catching both the car body lines and the person's face, glossy floor reflection beneath the car. Both subjects equally sharp at f/5.6 deep depth of field. Editorial Top Gear / Car and Driver magazine cover aesthetic. Shot on Hasselblad medium format with 80mm prime, natural colour grading, no HDR, no oversharpening, photoreal magazine quality, single moment captured on a real camera. Strictly ONE person and ONE car in the frame, no duplicates, no extras.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 0 },

  // ── Driver Hero Shot ──
  { id: "person_car_hero_sunset", name: "Driver Hero Shot", description: "You leaning against your car at sunset", icon: "🌇", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic editorial photograph featuring the EXACT person from image 1 standing beside the EXACT car from image 2 on a winding coastal mountain alpine road at golden hour sunset. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person leans casually against the front quarter panel of the car, body angled three-quarters toward the camera, face turned to camera with a gentle natural smile, one hand resting on the bonnet, relaxed confident posture. Wearing the same outfit as in image 1 if visible, otherwise a worn denim jacket over a plain top and faded jeans. CAR: the car must be PIXEL-PERFECT identical to image 2 — same make, model, year, exact paint colour, every wheel and rim, all badges and brand emblems, the license plate text and font readable and identical, headlights, grille, every panel line preserved unchanged. Do NOT redesign or restyle the car. SCENE: warm orange backlight from a low setting sun behind dramatic snow-capped alpine peaks, real lens flare in the corner, atmospheric haze, soft warm fill light on the face. Both subjects equally sharp at f/5.6 deep depth of field. Shot on Leica Q3 35mm prime, Kodak Portra 400 film stock aesthetic, slight film grain, natural colour grading, no HDR, no oversharpening, head-to-knees framing. Editorial magazine cover quality. Strictly ONE person and ONE car in the frame, no duplicates, no extras.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 1 },

  // ── Proud Owner ──
  { id: "person_car_garage_owner", name: "Proud Owner", description: "You with your car in a luxury garage", icon: "🔑", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic editorial photograph featuring the EXACT person from image 1 standing proudly beside the EXACT car from image 2 inside a private high-end collector's garage. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person stands at the driver door, body angled three-quarters toward the camera, face turned to camera with a confident gentle smile, one hand resting lightly on the bonnet. Wearing the same outfit as in image 1 if visible, otherwise a smart-casual open button-down or blazer over a top, dark trousers, wristwatch visible. CAR: the car must be PIXEL-PERFECT identical to image 2 — same make, model, year, exact paint colour, every wheel and rim, all badges and brand emblems, the license plate text and font readable and identical, headlights, grille, every panel line preserved unchanged. Do NOT redesign or restyle the car. SCENE: polished concrete garage floor with subtle reflection beneath the car, ambient track lighting from above, distant tool chests and motorsport memorabilia softly visible, neon shop sign on the far wall, premium private collector aesthetic. Both subjects equally sharp at f/5.6 deep depth of field. Shot on Sony A7R V 50mm prime, available light mixed with overhead studio softbox, natural colour grading, no HDR, no oversharpening, head-to-knees framing. Editorial magazine quality. Strictly ONE person and ONE car in the frame, no duplicates, no extras.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 2 },

  // ── Track Day Champion ──
  { id: "person_car_track_day", name: "Track Day Champion", description: "You with your car at the race track", icon: "🏎️", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic editorial motorsport photograph featuring the EXACT person from image 1 standing beside the EXACT car from image 2 on a professional racetrack. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person stands relaxed at the front quarter panel, body angled three-quarters toward the camera, face turned to camera with a focused confident expression, holding a racing helmet under one arm. Wearing the same outfit as in image 1 if visible, otherwise dark jeans, fitted plain top, and a casual zipped racing jacket. CAR: the car must be PIXEL-PERFECT identical to image 2 — same make, model, year, exact paint colour, every wheel and rim, all badges and brand emblems, the license plate text and font readable and identical, headlights, grille, every panel line preserved unchanged. Do NOT add racing stripes, change the spoiler, or apply decals not present in the input car. SCENE: red and white racing curbs visible, motorsport pit lane and grandstands gently blurred in the deep background, atmospheric heat haze rising from the asphalt, dramatic side lighting from a low afternoon sun, GT3 / Le Mans race day aesthetic. Both subjects equally sharp at f/5.6 deep depth of field. Shot on Canon EOS R5 35mm prime, natural light, magazine sports photography style, no HDR, no oversharpening, head-to-knees framing. Strictly ONE person and ONE car in the foreground, no team members, no pit crew, no other vehicles, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 3 },

  // ── Neon City Driver ──
  { id: "person_car_neon_night", name: "Neon City Driver", description: "You and your car in cyberpunk Tokyo", icon: "🌃", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic cinematic photograph featuring the EXACT person from image 1 leaning against the EXACT car from image 2 on a neon-lit Tokyo backstreet at night. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person leans back against the driver-side door, body angled three-quarters toward the camera, face turned to camera with a cool composed expression, hands in jacket pockets. Wearing the same outfit as in image 1 if visible, otherwise a black bomber or leather jacket, dark top, and dark jeans. CAR: the car must be PIXEL-PERFECT identical to image 2 — same make, model, year, exact paint colour, every wheel and rim, all badges and brand emblems, the license plate text and font readable and identical, headlights, grille, every panel line preserved unchanged. Do NOT redesign, restyle, or 'tune' the car. SCENE: vibrant pink, purple and cyan neon shop signs in the background with Japanese kanji characters, vending machines along the wall, narrow wet alley pavement with coloured reflection puddles (just light, no people reflected), atmospheric fog and steam, light rain misting in the air, Initial D / Tokyo Drift aesthetic, empty alley with no other people or cars. Realistic neon colour reflections playing across the cheekbones and the car's paint. Both subjects equally sharp at f/5.6 deep depth of field. Shot on Sony A7S III 50mm prime, available neon light only, cinematic colour grading, slight film grain, no HDR, no oversharpening, head-to-knees framing. Strictly ONE person and ONE car in the frame, no duplicates, no extras.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 4 },

  // ── Road Trip Story ──
  { id: "person_car_road_trip", name: "Road Trip Story", description: "You and your car on an epic mountain road trip", icon: "🛣️", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic National Geographic style travel photograph featuring the EXACT person from image 1 standing beside the EXACT car from image 2 at a scenic mountain pullover overlook. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person stands relaxed near the rear quarter panel of the car, body angled three-quarters toward the camera, face turned to camera with a content travel-day soft smile, holding a paper coffee cup. Wearing the same outfit as in image 1 if visible, otherwise a hooded sweatshirt or puffer jacket and jeans, with sunglasses pushed up on top of the head (not covering the eyes). CAR: the car must be PIXEL-PERFECT identical to image 2 — same make, model, year, exact paint colour, every wheel and rim, all badges and brand emblems, the license plate text and font readable and identical, headlights, grille, every panel line preserved unchanged. Do NOT redesign or restyle the car. SCENE: sweeping mountain valley below, distant snow-capped peaks, road snaking through the landscape behind the car, golden hour warm directional sunlight, soft atmospheric haze in the far distance, real road trip travel-magazine aesthetic. Sun-kissed warmth on the face. Both subjects equally sharp at f/5.6 deep depth of field. Shot on Fujifilm GFX 100 35mm prime, Kodak Portra 400 colour grading, natural light, slight film grain, no HDR, no oversharpening, head-to-knees framing. Strictly ONE person and ONE car in the frame, no other cars or hikers visible, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 5 },

  // ─── INSIDE THE CAR scenes (interior shots) ──────────────

  // ── Driver Seat Hero ──
  { id: "person_car_driver_seat", name: "Driver Seat Hero", description: "You behind the wheel of your car", icon: "🚙", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic editorial photograph featuring the EXACT person from image 1 sitting in the driver's seat INSIDE the EXACT car from image 2. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person sits naturally in the driver's seat with both hands on the steering wheel, body relaxed against the seat, face turned three-quarters toward the camera with a calm confident expression, eyes looking slightly off-camera as if focused on the road. Wearing the same outfit as in image 1 if visible, otherwise a casual jacket and t-shirt, seatbelt fastened across the chest. CAR INTERIOR: extrapolate the interior of the car from image 2 (matching the make, model, year, and trim level shown in the exterior photo) — preserve the brand identity, dashboard layout, steering wheel design, badges, infotainment screen, and material/colour palette appropriate for that exact car model. The dashboard, gear shifter, and centre console are visible. Do NOT change the car make/model/brand. SCENE: shot from the front passenger seat angle looking back toward the driver, soft natural daylight coming through the windshield and side windows, leather/upholstery details visible, slight bokeh on the background through the windows. Both the person and the car interior equally sharp at f/4. Shot on Sony A7 IV 35mm prime, natural colour grading, no HDR, no oversharpening, photoreal automotive editorial quality. Strictly ONE person inside the car, no passengers, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 10 },

  // ── Steering Wheel POV ──
  { id: "person_car_wheel_pov", name: "Wheel Grip", description: "Hands on the wheel, ready to drive", icon: "🎯", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic close-up automotive photograph featuring the EXACT person from image 1 in the driver's seat of the EXACT car from image 2, framed from the chest up. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person grips the steering wheel firmly with both hands at the 9-and-3 position, body squared toward the front, face turned slightly toward the camera with a focused intense expression, eyes looking straight ahead through the windshield. Wearing the same outfit as in image 1 if visible, otherwise a fitted dark jacket. The steering wheel with the EXACT brand logo of the car from image 2 is prominently visible in the lower portion of the frame. CAR INTERIOR: extrapolate the interior matching the make, model, year, and trim level shown in image 2 — preserve the brand identity, dashboard layout, steering wheel design and emblem, infotainment screen, material/colour palette appropriate for that exact car. Do NOT change the car brand or model. SCENE: cinematic side window light illuminating one side of the face, the other side in soft shadow, blurred background visible through the windscreen, automotive magazine cinematic mood. Sharp focus on the person and the steering wheel emblem. Shot on Canon EOS R5 50mm prime at f/2.8, cinematic colour grading, slight film grain, no HDR. Photoreal Top Gear feature aesthetic. Strictly ONE person, no passengers, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 11 },

  // ── Sunset Drive Interior ──
  { id: "person_car_sunset_drive", name: "Sunset Drive", description: "Cruising at golden hour, light through the windshield", icon: "🌇", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic cinematic photograph featuring the EXACT person from image 1 driving the EXACT car from image 2 at golden hour. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person sits in the driver's seat, one hand resting casually on the steering wheel, the other hand on the gear shifter, body relaxed, face turned three-quarters toward the camera with a peaceful content smile, eyes squinting gently against the warm sun. Wearing the same outfit as in image 1 if visible, otherwise a casual t-shirt and a denim or leather jacket. CAR INTERIOR: extrapolate from image 2 — preserve the brand identity, dashboard, steering wheel emblem, infotainment screen, and material/colour palette appropriate for the exact car make and model shown in image 2. Do NOT change the car brand. SCENE: warm orange and pink golden hour light streaming through the windshield from a low setting sun directly ahead, dramatic god-rays, lens flare on the dashboard, soft warm fill on the cheeks, the road curving away into the distance visible through the windshield, blurred countryside motion outside the side windows. Both person and interior sharp at f/4 deep depth of field. Shot on Leica SL2 35mm prime, Kodak Portra 400 colour grading, slight film grain, natural light, no HDR. Photoreal cinematic editorial aesthetic. Strictly ONE person inside the car, no passengers, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 12 },

  // ── Night City Drive Interior ──
  { id: "person_car_night_drive", name: "Night City Drive", description: "Inside the car at night, neon reflections on your face", icon: "🌃", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic cinematic Drive movie style photograph featuring the EXACT person from image 1 driving the EXACT car from image 2 through a neon-lit city at night. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person sits in the driver's seat with one hand on the steering wheel, the other resting on the gear shifter, body relaxed, face turned slightly toward the camera with a cool focused expression. Wearing the same outfit as in image 1 if visible, otherwise a black bomber jacket over a dark t-shirt. CAR INTERIOR: extrapolate from image 2 — preserve the brand identity, dashboard layout, steering wheel emblem, infotainment screen glow, and material/colour palette appropriate for the exact car make and model. Do NOT change the car brand. SCENE: vibrant pink, purple, cyan and red neon city lights streaming past the side windows, motion blur on the lights outside, neon colour reflections playing across the cheekbones and the dashboard, dim ambient interior lighting from the dashboard glow, the windshield revealing wet city street reflections ahead, Initial D / Drive 2011 cinematic aesthetic. Soft focus on motion-blurred neon outside, sharp focus on the person and interior at f/2.8. Shot on ARRI Alexa 35mm cinema lens, cinematic teal-and-magenta colour grading, slight film grain, no HDR. Photoreal movie still quality. Strictly ONE person inside the car, no passengers, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 13 },

  // ─── You + Your Girlfriend (couple composites) ──────────
  // Two-photo couple shots using Nano Banana 2 single-shot multi-image edit.
  // Image 1 = your photo, Image 2 = your girlfriend's photo

  // ── Romantic Dinner ──
  { id: "couple_romantic_dinner", name: "Candlelit Dinner", description: "An elegant candlelit dinner together", icon: "🕯️", category: "you_and_girlfriend",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Her Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "person.crop.circle.badge.plus",
    },
    prompt: "Create a photorealistic editorial photograph of a romantic candlelit dinner featuring the EXACT person from image 1 and the EXACT person from image 2 sitting together at an intimate restaurant table. PRESERVE BOTH IDENTITIES: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features for the person in image 1 AND for the person in image 2 with photographic accuracy. Both people are seated at a small round candlelit table facing each other but slightly turned toward the camera. The person from image 1 is on the left, the person from image 2 is on the right, both with warm relaxed smiles, leaning in slightly toward each other. Their hands meet across the table holding wine glasses. Wearing the same outfits as in their respective photos if visible, otherwise smart elegant evening wear. SCENE: an upscale intimate restaurant interior, warm candlelight from a flickering candle on the table, soft amber bokeh of restaurant lights in the background, fine dining ambiance, dark wood and brass details, plates with food, two glasses of wine, a single rose in a slim vase. Soft warm side lighting on both faces. Both people equally sharp at f/2.8. Shot on Sony A7R V 50mm prime, cinematic warm colour grading, slight film grain, no HDR. Photoreal magazine quality. Strictly TWO people in the frame (one from image 1, one from image 2), no other diners, no waiters, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 1 },

  // ── Beach Sunset Walk ──
  { id: "couple_beach_sunset", name: "Beach Sunset", description: "Walking together on a beach at golden hour", icon: "🏖️", category: "you_and_girlfriend",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Her Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "person.crop.circle.badge.plus",
    },
    prompt: "Create a photorealistic cinematic photograph of a couple walking together on a tropical beach at golden hour sunset, featuring the EXACT person from image 1 and the EXACT person from image 2. PRESERVE BOTH IDENTITIES: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features for the person in image 1 AND for the person in image 2 with photographic accuracy. Both people walk barefoot along the wet sand at the water's edge, hand in hand, the person from image 1 on the left and the person from image 2 on the right, both turned slightly toward the camera with relaxed natural smiles, hair gently moved by a soft sea breeze. Wearing the same outfits as in their respective photos if visible, otherwise casual beachwear (linen shirt and rolled-up pants for one, a flowing summer dress for the other). SCENE: warm orange and pink sunset sky, the sun sitting low on the horizon casting long shadows on the wet sand, gentle waves lapping at their feet, palm trees silhouetted in the distance, soft warm rim light catching their hair. Both people equally sharp at f/4 deep depth of field. Shot on Leica Q3 35mm prime, Kodak Portra 400 film stock, slight grain, natural colour grading, no HDR. Editorial lifestyle magazine quality. Strictly TWO people in the frame, no other figures, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 2 },

  // ── Paris Eiffel Tower ──
  { id: "couple_paris", name: "Paris Trip", description: "Together in front of the Eiffel Tower", icon: "🗼", category: "you_and_girlfriend",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Her Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "person.crop.circle.badge.plus",
    },
    prompt: "Create a photorealistic travel photograph of a couple in Paris with the Eiffel Tower in the background, featuring the EXACT person from image 1 and the EXACT person from image 2. PRESERVE BOTH IDENTITIES: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features for the person in image 1 AND for the person in image 2 with photographic accuracy. Both people stand close together on the Trocadéro plaza, the person from image 1 has an arm around the shoulders of the person from image 2, both turned toward the camera with happy genuine smiles, the person from image 2 leaning slightly into the embrace. Wearing the same outfits as in their respective photos if visible, otherwise stylish smart-casual travel attire (a coat and scarf appropriate for Paris weather). SCENE: the Eiffel Tower stands prominently in the background slightly behind and to one side of the couple, soft Parisian afternoon light, the cobblestone Trocadéro plaza, a few distant tourists very softly blurred far in the distance, autumn or spring atmosphere. Both people sharp in the foreground, the Eiffel Tower in clear focus behind them at f/5.6. Shot on Fujifilm GFX 100 35mm prime, natural colour grading, slight film grain, travel magazine aesthetic. Photoreal editorial quality. Strictly TWO people in the foreground (one from image 1, one from image 2), no other prominent figures, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 3 },

  // ── Cozy Cafe Date ──
  { id: "couple_cafe", name: "Coffee Date", description: "A cozy cafe date together", icon: "☕", category: "you_and_girlfriend",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Her Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "person.crop.circle.badge.plus",
    },
    prompt: "Create a photorealistic lifestyle photograph of a couple on a cozy coffee date, featuring the EXACT person from image 1 and the EXACT person from image 2 sitting together at a wooden cafe table by a window. PRESERVE BOTH IDENTITIES: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features for the person in image 1 AND for the person in image 2 with photographic accuracy. The person from image 1 sits on the left, the person from image 2 sits on the right, both leaning slightly toward each other with warm genuine smiles and a relaxed conversation vibe, both holding warm coffee mugs with both hands, eyes turned toward the camera. Wearing the same outfits as in their respective photos if visible, otherwise cozy casual sweaters or hoodies. SCENE: the warm interior of an artisan coffee shop with wood and exposed brick, soft natural daylight streaming through a large window beside them creating beautiful side light, two latte art coffees on the table, a small plate of pastries, books or a notebook nearby, soft bokeh of the cafe interior in the background. Both people sharp at f/2.8 with gentle background blur. Shot on Sony A7 IV 50mm prime, warm cosy colour grading, slight film grain, lifestyle magazine quality. Strictly TWO people at the table (one from image 1, one from image 2), no other customers in close range, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 4 },

  // ── Wedding Portrait ──
  { id: "couple_wedding", name: "Wedding Portrait", description: "An elegant wedding day portrait", icon: "💍", category: "you_and_girlfriend",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Her Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "person.crop.circle.badge.plus",
    },
    prompt: "Create a photorealistic editorial wedding portrait featuring the EXACT person from image 1 and the EXACT person from image 2 as a bride and groom on their wedding day. PRESERVE BOTH IDENTITIES: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features for the person in image 1 AND for the person in image 2 with photographic accuracy. The person from image 1 (groom) wears an elegant fitted dark navy or charcoal three-piece wedding suit with a white shirt, tie, and a small white boutonnière. The person from image 2 (bride) wears an elegant white wedding dress with delicate lace details, holding a soft pastel bouquet of flowers. They stand close together facing each other slightly, the groom's hand gently on the bride's waist, both turned toward the camera with warm radiant smiles, foreheads almost touching. SCENE: a romantic outdoor garden venue at golden hour with lush greenery and soft fairy lights in the background, gentle warm sunlight filtering through trees, soft bokeh of garden lights and petals in the air, classic wedding photography aesthetic. Both people equally sharp at f/2.8 with dreamy background bokeh. Shot on Canon EOS R5 85mm prime, soft warm colour grading, natural light, no HDR, slight film grain. Photoreal premium wedding magazine quality. Strictly TWO people in the frame (one from image 1, one from image 2), no other guests, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 5 },

  // ── Door Open Step Out ──
  { id: "person_car_step_out", name: "Stepping Out", description: "Stepping out of the car door, paparazzi vibe", icon: "🚪", category: "you_and_car",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Your Photo", photo2Label: "Car Photo",
      photo1Icon: "person.crop.circle.fill", photo2Icon: "car.fill",
    },
    prompt: "Create a photorealistic editorial paparazzi style photograph featuring the EXACT person from image 1 stepping out of the EXACT car from image 2 with the driver's door fully open. PERSON: preserve the same face, hair, skin tone, eye colour, eyebrows, lip shape, and all identifying features from image 1 with photographic accuracy. The person is mid-step exiting the car — one foot on the ground, one hand on the open door frame, the other hand holding the door's interior handle, body angled toward the camera, face looking directly at the camera with a confident charismatic expression. Wearing the same outfit as in image 1 if visible, otherwise stylish smart-casual attire (a fitted blazer or jacket over a top, dark trousers, watch visible, sunglasses optional). CAR: the car must be PIXEL-PERFECT identical to image 2 — same make, model, year, exact paint colour, wheels, badges, brand emblems, license plate text and font, headlights, grille, every panel preserved unchanged. The opened driver door reveals the interior briefly — extrapolate the interior matching the brand and trim of image 2. Do NOT redesign the car. SCENE: a clean modern outdoor setting (hotel entrance or boutique street), soft natural ambient daylight, slight bokeh background, paparazzi photojournalism aesthetic. Both person and car equally sharp at f/4. Shot on Sony A7R V 50mm prime, natural colour grading, no HDR, full body framing showing the person, the open door, and the front quarter of the car. Strictly ONE person and ONE car in the frame, no other people, no duplicates.",
    coinCost: 10, estimatedSeconds: 90, sortOrder: 14 },

  // ─── Video ──────────────────────────────────────────────
  // Disabled: video category was removed from the app.
  { id: "video_talking", name: "Talking Head", description: "Make your photo talk", icon: "🗣️", category: "video",
    prompt: "Generate a talking head video from this portrait, natural lip sync, subtle head movements, professional quality",
    coinCost: 5, estimatedSeconds: 90, sortOrder: 80, falModel: "fal-ai/sadtalker", isActive: false },
  { id: "video_dance", name: "Dance", description: "Make your photo dance", icon: "💃", category: "video",
    prompt: "Generate a dancing video from this portrait, fun dance moves, smooth animation, full body movement",
    coinCost: 6, estimatedSeconds: 120, sortOrder: 81, falModel: "fal-ai/live-portrait", isActive: false },
  { id: "video_sing", name: "Singing", description: "Make your photo sing", icon: "🎤", category: "video",
    prompt: "Generate a singing video from this portrait, expressive lip movements, head bobbing, emotional performance",
    coinCost: 5, estimatedSeconds: 90, sortOrder: 82, falModel: "fal-ai/sadtalker", isActive: false },
  { id: "video_aging", name: "Age Timelapse", description: "Watch yourself age in video", icon: "⏳", category: "video",
    prompt: "Generate an aging timelapse video, smooth transition from young to old, realistic skin aging, hair graying",
    coinCost: 6, estimatedSeconds: 120, sortOrder: 83, falModel: "fal-ai/live-portrait", isActive: false },
  { id: "video_wink", name: "Wink & Smile", description: "Make your photo wink", icon: "😉", category: "video",
    prompt: "Generate a short video of this person winking and smiling naturally, subtle facial animation",
    coinCost: 4, estimatedSeconds: 60, sortOrder: 84, falModel: "fal-ai/live-portrait", isActive: false },

  // ─── Model Photoshoot (single-photo fashion editorial) ──
  // Single-photo flow using Nano Banana 2 instructed editing.
  // Each prompt explicitly preserves the person's face/identity from
  // image 1 and only changes the wardrobe / scene / lighting / style.

  // ── Vogue Cover ──
  { id: "shoot_vogue_cover", name: "Vogue Cover", description: "High fashion magazine cover", icon: "📸", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic Vogue magazine cover featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair colour and length, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person poses confidently centred in frame, body angled three-quarters toward the camera, head up and slightly tilted, intense magazine-cover gaze directly at the lens, glossy minimalist expression. Wearing a high-fashion couture outfit (a sculptural designer dress or sharp tailored blazer with statement jewelry), styled hair, soft natural makeup with bold lip. SCENE: a clean off-white seamless studio backdrop with a subtle gradient. LIGHTING: dramatic single softbox key light from camera-left, soft fill from a reflector camera-right, subtle hair light from above, classic Vogue cover lighting. Both face and outfit razor-sharp at f/8. Shot on Hasselblad H6D 100c medium format with 100mm portrait lens, natural colour grading, no HDR, no oversharpening, photoreal magazine quality. Strictly ONE person in the frame, no other figures.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 1 },

  // ── Editorial Studio ──
  { id: "shoot_editorial_studio", name: "Editorial Studio", description: "High-end studio fashion editorial", icon: "🎬", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic high-end fashion editorial photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person poses dynamically with one shoulder dropped, hand resting on hip, head turned slightly away from the camera with eyes flicking back to the lens, sophisticated runway model expression. Wearing a sleek monochrome avant-garde designer outfit, dramatic styled hair, editorial high-fashion makeup. SCENE: a polished concrete studio floor with a deep grey textured backdrop. LIGHTING: hard rim light from behind sculpting the silhouette, soft front fill, dramatic shadows on the backdrop, Steven Meisel editorial style. Razor-sharp at f/5.6. Shot on Phase One IQ4 medium format with 80mm prime, professional fashion photography colour grading, no HDR. Strictly ONE person in the frame.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 2 },

  // ── Black & White Classic ──
  { id: "shoot_bw_classic", name: "Black & White", description: "Cinematic black and white portrait", icon: "🎞️", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic cinematic black-and-white portrait photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair, skin tone (rendered in greyscale), eye shape, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person poses with a calm contemplative expression, head turned three-quarters to the camera, soft natural eye contact, hands gently resting (one near the collar of a simple top). Wearing an elegant simple black or white turtleneck or knit sweater. SCENE: a deep black studio backdrop with subtle texture. LIGHTING: dramatic single key light creating deep chiaroscuro shadows on one side of the face, beautiful catchlights in the eyes, classic Peter Lindbergh editorial style. Razor-sharp at f/4. Shot on Leica M11 Monochrom with 50mm Summilux prime, true black-and-white film aesthetic, fine grain, rich tonal range, no HDR. Strictly ONE person in the frame.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 3 },

  // ── Couture Runway ──
  { id: "shoot_couture_runway", name: "Couture Runway", description: "Walking the haute couture runway", icon: "👗", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic haute couture runway photograph featuring the EXACT person from image 1 walking down a Paris fashion week catwalk. PRESERVE IDENTITY: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person walks confidently mid-stride toward the camera, body squared to the lens, intense focused fashion-week expression, eyes locked on the camera. Wearing a stunning haute couture gown or avant-garde designer ensemble with dramatic silhouette and intricate detailing. SCENE: a polished white runway with the soft blurred crowd of fashion editors and photographers in the dim background, runway lights flanking the catwalk. LIGHTING: dramatic overhead runway spotlights illuminating the person from above, softly reflected light from below, glamorous runway aesthetic. Sharp focus on the person at f/5.6, subtle motion blur on the background. Shot on Canon EOS R5 with 70-200mm f/2.8 telephoto compression, fashion week magazine photography style. Strictly ONE person in the foreground, blurred crowd far in the background only.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 4 },

  // ── Urban Streetwear ──
  { id: "shoot_streetwear", name: "Streetwear Editorial", description: "NYC street style fashion shoot", icon: "🧢", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic urban streetwear editorial photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person stands confidently in the middle of a NYC street with one hand in pocket, body squared to the camera, cool composed expression, slight smirk. Wearing on-trend hypebeast streetwear: an oversized vintage hoodie or designer jacket, baggy cargo trousers, fresh sneakers, gold chain, possibly a bucket hat or cap. SCENE: a moody NYC street with graffiti walls, fire escapes, yellow taxi blurred in the distance, late afternoon golden side light, slight atmospheric haze. LIGHTING: warm side light from a low sun creating long shadows on the asphalt. Razor-sharp at f/4 with gentle background blur. Shot on Fujifilm X-T5 with 35mm prime, contemporary streetwear magazine aesthetic (Hypebeast / Highsnobiety), slight film grain. Strictly ONE person in the frame.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 5 },

  // ── Beach Editorial ──
  { id: "shoot_beach_editorial", name: "Beach Editorial", description: "Tropical beach swimwear shoot", icon: "🌴", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic tropical beach editorial fashion photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair (with subtle wind movement), skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person stands on the wet sand at the edge of the ocean, body angled three-quarters to the camera, relaxed natural pose, gentle smile, hair caught in a soft breeze. Wearing a stylish modest resort outfit (a flowing linen kaftan, a tasteful one-piece swimsuit, or a chic beach cover-up). SCENE: golden sand, turquoise ocean waves rolling in behind, palm trees in the distance, golden hour warm sunset light, soft pastel sky. LIGHTING: warm directional golden hour backlight, soft fill on the face from a reflector. Razor-sharp at f/4. Shot on Sony A7R V with 85mm portrait prime, Vogue beach editorial aesthetic, natural sun-kissed colour grading, no HDR. Strictly ONE person in the frame, no other figures on the beach.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 6 },

  // ── Vintage 70s Glamour ──
  { id: "shoot_vintage_70s", name: "70s Glamour", description: "Retro 1970s fashion film aesthetic", icon: "🪩", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic vintage 1970s glamour fashion photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair (restyled in a 70s feathered Farrah Fawcett wave or shag if appropriate), skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person poses with one hand near the face, head tilted back slightly, dreamy soulful expression, half-smile. Wearing iconic 70s fashion (a wide-collar silk shirt, suede fringe jacket, or a flowing bohemian dress with bold patterns). SCENE: warm studio backdrop in burnt orange or mustard yellow, possibly with macramé or rattan props softly visible. LIGHTING: warm Kodachrome film lighting, gentle key light, dreamy soft fill, period-accurate colour palette. Razor-sharp at f/5.6 with film grain. Shot on Hasselblad 500C with 80mm Planar lens, Kodak Portra 160 film aesthetic, slight warm film grain, faded vintage colour grading, light leaks in the corners. Strictly ONE person in the frame.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 7 },

  // ── Beauty Closeup ──
  { id: "shoot_beauty_closeup", name: "Beauty Closeup", description: "Intimate beauty and makeup shot", icon: "💄", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic high-end beauty editorial close-up photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face structure, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person's face fills most of the frame, head and shoulders only, head tilted slightly with a soft serene expression, eyes either closed gently or looking directly at the camera. Wearing professional editorial makeup (subtle but flawless: dewy skin, defined eyebrows, soft eyeshadow, statement lip), styled hair pulled back to show the face. Beautiful real photographic skin texture (visible pores, fine details, real human imperfections). NEVER airbrushed, NEVER plastic. SCENE: a clean soft pastel backdrop. LIGHTING: classic beauty butterfly lighting from above and slightly in front, soft white reflector below the chin, even smooth illumination across the face. Razor-sharp at f/8 macro detail. Shot on Phase One IQ4 medium format with 120mm macro lens, beauty editorial aesthetic (Allure / Harper's Bazaar Beauty), natural skin-true colour grading. Strictly ONE person, head-and-shoulders crop only.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 8 },

  // ── Activewear Campaign ──
  { id: "shoot_activewear", name: "Activewear Campaign", description: "Nike/Adidas style sport campaign", icon: "🏃", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic premium athletic campaign photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person poses dynamically as if mid-action: one foot forward, body angled, arms in athletic stance, intense focused expression, eyes fixed forward with determination. Wearing premium fitted athletic gear: a fitted athletic compression t-shirt, athletic shorts or training tights, premium running shoes (Nike, Adidas, or On-style branding), modern dark colours. The wardrobe is fully covered, modest, professional sportswear. SCENE: an urban running track or modern outdoor athletic setting, soft directional morning light, slight motion blur in the background suggesting movement. LIGHTING: dramatic side rim light highlighting muscles and athletic form, soft fill on the face. Razor-sharp at f/4. Shot on Sony A1 with 70-200mm GM telephoto, premium sportswear campaign aesthetic (Nike Just Do It), natural colour grading. Strictly ONE person in the frame, professional and modest athletic wear only.",
    coinCost: 8, estimatedSeconds: 60, sortOrder: 9 },

  // ── Avant-Garde Art ──
  { id: "shoot_avant_garde", name: "Avant-Garde Art", description: "Conceptual high art fashion shoot", icon: "🎨", category: "photoshoot",
    falModel: "fal-ai/nano-banana-2/edit",
    prompt: "Create a photorealistic avant-garde conceptual art fashion photograph featuring the EXACT person from image 1. PRESERVE IDENTITY: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features with photographic accuracy. The person poses in a striking sculptural stance: arms creating geometric angles, head tilted in an unusual artistic angle, intense unblinking expression, almost statuesque. Wearing extreme avant-garde designer clothing (a sculptural Comme des Garçons / Iris van Herpen / Rick Owens style outfit with unusual silhouettes, possibly architectural shoulders, draped fabric, or 3D-printed elements). SCENE: a minimalist gallery space with one bold accent colour wall (deep red, electric blue, or neon yellow). LIGHTING: dramatic single hard light source creating a sharp shadow on the wall behind, museum-quality dramatic illumination. Razor-sharp at f/8. Shot on Hasselblad H6D-400c medium format with 80mm prime, Dazed magazine / i-D conceptual editorial aesthetic, bold artistic colour grading. Strictly ONE person in the frame.",
    coinCost: 9, estimatedSeconds: 65, sortOrder: 10 },

  // ─── Product × Model (product marketing composites) ─────
  // Two-photo flow using Nano Banana 2 multi-image editing.
  // Image 1 = product photo, Image 2 = woman model photo
  // Each prompt explicitly preserves BOTH the product details AND the
  // model's identity, then composes them into a marketing scene.

  // ── Perfume Campaign ──
  { id: "product_perfume", name: "Perfume Campaign", description: "Luxury perfume marketing shot", icon: "🌸", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic luxury perfume advertising photograph featuring the EXACT product from image 1 and the EXACT woman model from image 2. PRESERVE THE PRODUCT: the perfume bottle from image 1 must be PIXEL-PERFECT identical — same shape, label text, brand logo, colour, cap, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model holds the perfume bottle elegantly near her face or just below her chin, eyes half-closed in a serene seductive expression, head tilted slightly, glamorous high-fashion makeup, hair softly styled. Wearing an elegant minimalist top or bare-shoulder neckline appropriate for a perfume ad. SCENE: a soft cream or pale gold studio backdrop with subtle gradient. LIGHTING: classic beauty butterfly lighting from above and front, dreamy soft fill, glowing skin highlights, magazine-quality glamour lighting. Both the product and the model razor-sharp at f/4. Shot on Hasselblad medium format with 100mm portrait lens, Chanel / Dior perfume ad aesthetic. Strictly ONE product and ONE model in the frame.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 1 },

  // ── Skincare Routine ──
  { id: "product_skincare", name: "Skincare Routine", description: "Beauty skincare brand campaign", icon: "🧴", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic premium skincare brand campaign photograph featuring the EXACT product from image 1 and the EXACT woman model from image 2. PRESERVE THE PRODUCT: the skincare bottle/jar/tube from image 1 must be PIXEL-PERFECT identical — same shape, label text, brand logo, colour, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model holds the skincare product gently near her cheek with one hand, fingers visible holding the product, fresh natural radiant expression with a soft genuine smile. Glowing dewy skin with realistic real photographic texture (visible pores, natural imperfections, NOT airbrushed). Hair pulled back in a clean simple style. Wearing a soft white cotton robe or minimalist tank. SCENE: a clean spa-like minimalist white bathroom or studio backdrop with subtle natural elements (eucalyptus, marble). LIGHTING: bright natural soft window light, even soft illumination, fresh morning aesthetic. Razor-sharp at f/4. Shot on Sony A7R V with 85mm portrait lens, premium skincare brand campaign aesthetic (La Mer, Estée Lauder, Glossier). Strictly ONE product and ONE model.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 2 },

  // ── Lipstick Beauty ──
  { id: "product_lipstick", name: "Lipstick Closeup", description: "Bold lipstick beauty closeup", icon: "💄", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic high-end beauty close-up photograph featuring the EXACT lipstick product from image 1 and the EXACT woman model from image 2. PRESERVE THE PRODUCT: the lipstick from image 1 must be PIXEL-PERFECT identical — same shape, casing colour, brand logo, label text, lip colour shade, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model holds the lipstick near her lips with elegant fingers, lips slightly parted in a sensual fashion-editorial pose, head tilted, bold lipstick colour from the product visibly applied to her lips matching the product colour. Eyes looking slightly off-camera with editorial intensity. Real photographic skin texture (visible pores, natural human imperfections), NOT airbrushed. SCENE: a clean dark or richly coloured studio backdrop in a tone that complements the lipstick. LIGHTING: classic beauty butterfly lighting from above with strong rim lighting on the cheekbones, glossy magazine-cover quality. Razor-sharp at f/8 macro detail. Shot on Phase One IQ4 medium format with 120mm macro lens, Allure / Harper's Bazaar Beauty aesthetic. Strictly ONE product and ONE model, head-and-shoulders crop.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 3 },

  // ── Watch Lifestyle ──
  { id: "product_watch", name: "Luxury Watch", description: "Premium watch lifestyle shot", icon: "⌚", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic luxury watch lifestyle photograph featuring the EXACT watch product from image 1 worn by the EXACT woman model from image 2. PRESERVE THE PRODUCT: the watch from image 1 must be PIXEL-PERFECT identical — same case shape, dial, hands, brand logo, bezel, strap colour and material, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model wears the watch on her wrist, holding her hand elegantly near her face or her chin, the watch face clearly visible to the camera. She has a sophisticated confident expression, slight smile, polished look. Wearing an elegant minimalist top or chic blazer in neutral colours. Manicured nails. SCENE: a luxurious soft-focus background — could be a high-end hotel lobby, marble surface, or gradient studio with warm tones. LIGHTING: warm sophisticated three-point lighting, dramatic key light highlighting the watch face, soft fill on the model. Razor-sharp at f/4 with the watch in particular focus. Shot on Sony A7R V with 85mm portrait lens, Rolex / Cartier / Omega luxury watch campaign aesthetic. Strictly ONE product and ONE model in the frame.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 4 },

  // ── Handbag Editorial ──
  { id: "product_handbag", name: "Handbag Editorial", description: "Designer handbag fashion shoot", icon: "👜", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic designer handbag fashion editorial photograph featuring the EXACT handbag product from image 1 carried by the EXACT woman model from image 2. PRESERVE THE PRODUCT: the handbag from image 1 must be PIXEL-PERFECT identical — same shape, colour, leather texture, hardware, brand logo, stitching, handles, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model carries the handbag on her arm or holds it elegantly by the handles in front of her body, body angled three-quarters to the camera, confident editorial pose, head turned slightly toward the lens, sophisticated expression with a slight smirk. Wearing a chic monochrome outfit (a tailored coat, fitted dress, or blazer combo) that complements but doesn't compete with the handbag. SCENE: an upscale Parisian street, hotel staircase, or minimalist designer boutique interior. LIGHTING: soft directional natural daylight, sophisticated cinematic colour grading. Razor-sharp at f/4 with both model and handbag clearly visible. Shot on Canon EOS R5 with 50mm prime, Hermès / Chanel / Louis Vuitton campaign aesthetic. Strictly ONE product and ONE model.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 5 },

  // ── Sunglasses Cool ──
  { id: "product_sunglasses", name: "Sunglasses Style", description: "Designer sunglasses lifestyle ad", icon: "🕶️", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic designer sunglasses lifestyle advertising photograph featuring the EXACT sunglasses from image 1 worn by the EXACT woman model from image 2. PRESERVE THE PRODUCT: the sunglasses from image 1 must be PIXEL-PERFECT identical — same frame shape, colour, lens tint, brand logo on the temple, every detail unchanged. PRESERVE THE MODEL: keep the same face structure, hair, skin tone, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy (eyes will be partially covered by the sunglasses lenses). The model wears the sunglasses, head tilted slightly back, cool composed expression with a subtle confident smirk, hair softly windblown. Wearing a chic summer outfit (a silk shirt, linen dress, or stylish jacket). SCENE: a sun-soaked outdoor lifestyle setting — could be the French Riviera, a Miami palm-lined street, or a Mediterranean rooftop. LIGHTING: bright golden natural sunlight, warm shadows, soft reflections on the lenses showing a hint of the sky. Razor-sharp at f/4. Shot on Leica Q3 with 28mm prime, Ray-Ban / Persol / Gentle Monster campaign aesthetic. Strictly ONE product and ONE model.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 6 },

  // ── Coffee Brand ──
  { id: "product_coffee", name: "Coffee Lifestyle", description: "Café lifestyle brand shoot", icon: "☕", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic premium coffee brand lifestyle photograph featuring the EXACT coffee product from image 1 (cup/bag/can) and the EXACT woman model from image 2. PRESERVE THE PRODUCT: the coffee product from image 1 must be PIXEL-PERFECT identical — same packaging, brand logo, label colours, text, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model holds the coffee product warmly with both hands near her chest, looking down at it with a serene contented smile or looking directly at the camera with a warm welcoming expression. Wearing a cozy oversized sweater, knit cardigan, or denim jacket. SCENE: a warm cozy artisan coffee shop with wood and exposed brick, soft window light, blurred background of plants and bookshelves, steam softly rising from the cup if applicable. LIGHTING: warm natural window light, golden cosy aesthetic, lifestyle magazine quality. Razor-sharp at f/2.8 with subtle background bokeh. Shot on Sony A7 IV with 50mm prime, premium coffee brand aesthetic (Blue Bottle / Stumptown / Nespresso). Strictly ONE product and ONE model.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 7 },

  // ── Wine Toast ──
  { id: "product_wine", name: "Wine Brand", description: "Sophisticated wine brand campaign", icon: "🍷", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic sophisticated wine brand campaign photograph featuring the EXACT wine bottle product from image 1 and the EXACT woman model from image 2. PRESERVE THE PRODUCT: the wine bottle from image 1 must be PIXEL-PERFECT identical — same shape, label text, vintage year, brand logo, colour, foil, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model holds the wine bottle elegantly with one hand around the neck, holding it angled toward the camera so the label is clearly visible. Sophisticated warm smile, head tilted slightly, refined expression. Wearing an elegant evening dress or classy blouse in neutral or burgundy tones. SCENE: an upscale wine cellar with stone walls and wooden barrels in the background, OR an intimate fine-dining restaurant table with candlelight, OR a vineyard at golden hour. LIGHTING: warm intimate candlelight or golden hour light, sophisticated wine bar aesthetic, sommelier mood. Razor-sharp at f/4. Shot on Canon EOS R5 with 85mm portrait lens, premium wine brand campaign aesthetic. Strictly ONE product and ONE model.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 8 },

  // ── Jewelry Showcase ──
  { id: "product_jewelry", name: "Jewelry Showcase", description: "Fine jewelry editorial", icon: "💎", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic fine jewelry editorial photograph featuring the EXACT jewelry product from image 1 (necklace/ring/earrings/bracelet) worn by the EXACT woman model from image 2. PRESERVE THE PRODUCT: the jewelry piece from image 1 must be PIXEL-PERFECT identical — same metal colour, gemstones, settings, chain or band design, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model wears the jewelry prominently displayed (a necklace at the collarbone, a ring on a delicately raised hand near the face, earrings with hair pulled back, or a bracelet on a posed wrist). She has an elegant serene expression with a soft fashion-editorial gaze. Hair styled smoothly to showcase the jewelry. Bare shoulders or a simple sleek black top to let the jewelry stand out. SCENE: a clean dark velvet or rich burgundy backdrop with subtle texture. LIGHTING: dramatic single key light from above creating soft shadows that highlight the sparkle of the gemstones, jewelry-photography lighting that catches every facet. Razor-sharp at f/8 with both model and jewelry in clear focus. Shot on Phase One IQ4 medium format with 100mm macro lens, Tiffany / Cartier / Bulgari fine jewelry campaign aesthetic. Strictly ONE product and ONE model.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 9 },

  // ── Tech Product ──
  { id: "product_tech", name: "Tech Product", description: "Modern tech device lifestyle ad", icon: "📱", category: "product_model",
    inputMode: "twoPhotos", falModel: "fal-ai/nano-banana-2/edit",
    metadata: {
      photo1Label: "Product Photo", photo2Label: "Model Photo",
      photo1Icon: "shippingbox.fill", photo2Icon: "person.crop.circle.fill",
    },
    prompt: "Create a photorealistic modern tech lifestyle advertising photograph featuring the EXACT tech product from image 1 (phone/laptop/headphones/smartwatch/tablet) and the EXACT woman model from image 2. PRESERVE THE PRODUCT: the tech product from image 1 must be PIXEL-PERFECT identical — same shape, colour, brand logo, screen design, ports, buttons, every detail unchanged. PRESERVE THE MODEL: keep the same face, hair, skin tone, eye colour, eyebrows, lip shape, age, and all identifying features from image 2 with photographic accuracy. The model uses or holds the tech product naturally — if a phone, holding it up to take a photo or scroll; if headphones, wearing them with a relaxed listening expression; if a laptop, working on it with focused engagement; if a watch, glancing at her wrist. Confident modern professional expression, subtle warm smile. Wearing contemporary smart-casual clothing (a fitted knit sweater, blazer, or modern minimalist outfit). SCENE: a bright modern workspace, contemporary urban café, or sleek minimalist apartment with floor-to-ceiling windows. LIGHTING: clean bright natural daylight, soft modern Apple-style aesthetic. Razor-sharp at f/4. Shot on Sony A7 IV with 35mm prime, premium tech brand campaign aesthetic (Apple / Bose / Samsung). Strictly ONE product and ONE model.",
    coinCost: 9, estimatedSeconds: 75, sortOrder: 10 },
];
