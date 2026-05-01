import sharp from 'sharp';
import fs from 'fs/promises';

/**
 * Generate poster from fanart by cropping.
 *
 * Port from jcatch_plugin/main.py validate_output:
 * - If fanart exists and width > 700:
 *   - crop_width = min(width / 2, 379)
 *   - Crop right half: (width - crop_width, 0, width, height)
 * - Save as poster with quality 95
 *
 * @param {string} fanartPath - Path to fanart image
 * @param {string} posterPath - Path where poster should be saved
 * @returns {Promise<boolean>} True if poster was generated, false otherwise
 */
export async function generatePosterFromFanart(fanartPath, posterPath) {
  try {
    // Check if fanart exists
    await fs.access(fanartPath);

    const metadata = await sharp(fanartPath).metadata();
    const { width, height } = metadata;

    if (width > 700) {
      const max_width = 379;
      const cropWidth = Math.min(width / 2, max_width);

      // Crop right half
      await sharp(fanartPath)
        .extract({
          left: width - cropWidth,
          top: 0,
          width: cropWidth,
          height: height
        })
        .jpeg({ quality: 95 })
        .toFile(posterPath);

      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
