/**
 * Content safety helpers for AI-generated media.
 *
 * FAL.ai (and most diffusion models) return a solid black image when
 * their NSFW filter triggers, rather than throwing an error. We detect
 * these black/blank images by inspecting the file size — solid colors
 * compress drastically smaller than real generated content.
 */

/**
 * Heuristic check: did the model return a black/filtered image?
 *
 * Real flux-pulid generations at 1024x1024 typically produce JPEG/PNG
 * files in the 100KB–1MB range. NSFW-filtered solid black images
 * compress to roughly 5–15KB.
 *
 * We use a conservative threshold of 25KB which has near-zero false
 * positives on real content while catching essentially all filtered
 * images.
 */
export function isLikelyNSFWFilteredImage(
  buffer: Buffer,
  contentType: string
): boolean {
  // Don't apply to videos
  if (contentType.includes("video")) return false;

  const BLACK_IMAGE_THRESHOLD_BYTES = 25 * 1024;
  return buffer.byteLength < BLACK_IMAGE_THRESHOLD_BYTES;
}

export class NSFWFilteredError extends Error {
  constructor() {
    super(
      "Content safety filter triggered. Please use a different photo with appropriate content."
    );
    this.name = "NSFWFilteredError";
  }
}
