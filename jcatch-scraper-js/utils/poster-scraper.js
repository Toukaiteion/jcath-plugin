import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Get poster image URL from jav.wine.
 *
 * @param {string} number - Movie number (e.g., "FSDSS-549")
 * @returns {Promise<{url: string}>} ImageUrl object with URL
 */
export async function getPosterFromJavWine(number) {
  const url = `https://jav.wine/${number.toLowerCase()}`;

  try {
    const response = await axios.get(url, { timeout: 30000 });
    const $ = cheerio.load(response.data);

    const likesDiv = $('.likes img').first();
    if (likesDiv.length) {
      let imgSrc = likesDiv.attr('src') || '';
      if (imgSrc.startsWith('/')) {
        imgSrc = `https://jav.wine${imgSrc}`;
      }
      return { url: imgSrc, headers: {} };
    }
    return { url: '' };
  } catch (error) {
    return { url: '' };
  }
}

/**
 * Get poster image URL from www3.24-jav.com.
 *
 * @param {string} number - Movie number (e.g., "ADN-683")
 * @returns {Promise<{url: string}>} ImageUrl object with URL
 */
export async function getPosterFrom324Jav(number) {
  const url = `https://www3.24-jav.com/${number.toLowerCase()}`;

  try {
    const response = await axios.get(url, { timeout: 30000 });
    const $ = cheerio.load(response.data);

    const limageDiv = $('.limage img').first();
    if (limageDiv.length) {
      let imgSrc = limageDiv.attr('src') || '';
      if (imgSrc.startsWith('/')) {
        imgSrc = `https://www3.24-jav.com${imgSrc}`;
      }
      return { url: imgSrc, headers: {} };
    }
    return { url: '' };
  } catch (error) {
    return { url: '' };
  }
}

/**
 * Try to get poster from fallback sources.
 *
 * Priority: 324Jav -> JavWine
 *
 * @param {string} number - Movie number
 * @returns {Promise<{url: string, headers: Object}>} ImageUrl object
 */
export async function getPosterFallback(number) {
  // Try 324Jav first
  let poster = await getPosterFrom324Jav(number);
  if (poster.url) {
    return poster;
  }

  // Fallback to JavWine
  poster = await getPosterFromJavWine(number);
  return poster;
}
