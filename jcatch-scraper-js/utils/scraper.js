import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs/promises';

const BASE_URL = 'https://www.javbus.com';

/**
 * Fetch movie metadata from javbus.com using Playwright.
 *
 * @param {string} number - Movie number (e.g., "START-534")
 * @returns {Promise<Object>} Movie metadata object
 */
export async function fetchMetadata(number) {
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      locale: 'ja-JP',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const url = `${BASE_URL}/${number}`;
    await page.goto(url);

    // Wait for .movie element
    await page.waitForSelector('.movie', { timeout: 5000 });

    // Additional wait for dynamic content
    await page.waitForTimeout(2000);

    // Get page source after JS execution
    const html = await page.content();
    const $ = cheerio.load(html);

    // Parse fields
    const num = parseNum($);
    const title = parseTitle($);
    const releasedate = parseReleaseDate($);
    const year = parseYear(releasedate);
    const runtime = parseRuntime($);
    const studio = parseStudio($);
    const label = parseLabel($);
    const actors = parseActors($);
    const genres = parseGenres($);
    const fanartUrl = parseFanartUrl($);
    const extrafanartUrls = parseExtrafanartUrls($);

    // Build image headers with referer
    const headers = {
      referer: url,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
    };

    return {
      num,
      title,
      originaltitle: title,
      sorttitle: title,
      customrating: 'JP-18+',
      mpaa: 'JP-18+',
      studio,
      year,
      outline: '',
      plot: '',
      runtime,
      director: '',
      maker: studio,
      label,
      actors,
      tags: genres,
      genres,
      premiered: releasedate,
      releasedate,
      release: releasedate,
      cover: '',
      website: url,
      fanart: { url: fanartUrl, headers },
      thumb: { url: fanartUrl, headers },
      poster: { url: '', headers: {} },
      extrafanart: extrafanartUrls.map(u => ({ url: u, headers }))
    };
  } catch (error) {
    // Save debug info on error
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        const tempDir = `/tmp/jcatch_err_${Date.now()}`;
        await fs.mkdir(tempDir, { recursive: true });
        await page.screenshot({ path: path.join(tempDir, 'debug_screenshot.png') });
        await fs.writeFile(path.join(tempDir, 'debug_source.html'), await page.content());
        error.message = `Failed to fetch metadata for ${number}. Debug info saved at ${tempDir}: ${error.message}`;
      }
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Parsing methods

function parseNum($) {
  const elem = $('span[style*="#CC0000"]').first();
  return elem.text().trim() || '';
}

function parseTitle($) {
  const h3 = $('h3').first();
  return h3.text().trim() || '';
}

function parseReleaseDate($) {
  const paragraph = findParagraphWithHeader($, '發行日期:');
  if (!paragraph) return '';

  const fullText = paragraph.text().trim(); // '發行日期:2025-06-27'

  if (fullText.includes(':')) {
    return fullText.split(':')[1].trim();
  }
  return '';
}

function parseRuntime($) {
  const paragraph = findParagraphWithHeader($, '長度:');
  if (!paragraph) return 0;

  const span = paragraph.find('span');
  if (!span.length) return 0;

  const text = paragraph.text().trim();
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseStudio($) {
  const paragraph = findParagraphWithHeader($, '製作商:');
  if (!paragraph) return '';

  const link = paragraph.find('a').first();
  return link.text().trim() || '';
}

function parseLabel($) {
  const paragraph = findParagraphWithHeader($, '發行商:');
  if (!paragraph) return '';

  const link = paragraph.find('a').first();
  return link.text().trim() || '';
}

function parseActors($) {
  const actors = [];

  // Try star-name elements first
  $('.star-name a').each((_, el) => {
    const name = $(el).text().trim();
    if (name) actors.push({ name });
  });

  // Fallback to avatar-waterfall
  if (actors.length === 0) {
    $('#avatar-waterfall span').each((_, el) => {
      const name = $(el).text().trim();
      if (name) actors.push({ name });
    });
  }

  return actors;
}

function parseGenres($) {
  const genres = [];
  $('span.genre').each((_, el) => {
    const aTag = $(el).find('a').first();
    if (aTag.length) {
      const text = aTag.text().trim();
      genres.push(text);
    }
  });
  return genres;
}

function parseFanartUrl($) {
  const img = $('.bigImage img').first();
  if (!img.length) return '';

  let src = img.attr('src') || '';
  // Convert relative URL to absolute
  if (src.startsWith('/')) {
    return `${BASE_URL}${src}`;
  }
  return src;
}

function parseExtrafanartUrls($) {
  const urls = [];
  $('#sample-waterfall .sample-box').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      if (href.startsWith('/')) {
        urls.push(`${BASE_URL}${href}`);
      } else {
        urls.push(href);
      }
    }
  });
  return urls;
}

function findParagraphWithHeader($, headerText) {
  let result = null;
  $('p').each((_, el) => {
    const header = $(el).find('span.header').first();
    if (header.length && header.text().trim() === headerText) {
      result = $(el);
      return false; // break loop
    }
  });
  return result;
}

function parseYear(releasedate) {
  if (!releasedate) return 0;
  const year = releasedate.substring(0, 4);
  return parseInt(year, 10) || 0;
}