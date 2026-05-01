import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * Download an image with headers.
 *
 * @param {{url: string, headers: Object}} image - ImageUrl object with URL and headers
 * @param {string} savePath - Path where image should be saved
 * @throws {Error} If download fails
 */
export async function downloadImage(image, savePath) {
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(savePath), { recursive: true });

    const response = await axios.get(image.url, {
      headers: image.headers,
      responseType: 'arraybuffer',
      timeout: 30000
    });

    await fs.writeFile(savePath, response.data);
  } catch (error) {
    throw new Error(`Failed to download ${image.url}: ${error.message}`);
  }
}
