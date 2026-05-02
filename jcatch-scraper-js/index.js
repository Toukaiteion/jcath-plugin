#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import fs from 'fs/promises';
import { extractNumberFromPath } from './utils/extractor.js';
import { fetchMetadata } from './utils/scraper.js';
import { getPosterFallback } from './utils/poster-scraper.js';
import { downloadImage } from './utils/downloader.js';
import { generatePosterFromFanart } from './utils/image-cropper.js';
import { generateNFOFile } from './utils/nfo-generator.js';

// Parse CLI arguments
const argv = yargs(hideBin(process.argv))
  .option('movie-path', {
    alias: 'm',
    type: 'string',
    description: 'Path to video file',
    default: null
  })
  .option('num', {
    alias: 'n',
    type: 'string',
    description: 'Direct movie number (e.g., SSNI-998)',
    default: null
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output directory',
    default: process.cwd()
  })
  .help()
  .alias('help', 'h')
  .parse();

/**
 * Sleep for the given milliseconds.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Emit progress notification to stderr.
 * @param {string} step - Current step
 * @param {string} message - Progress message
 * @param {number} percent - Progress percentage (0-100)
 */
function emitProgress(step, message, percent) {
  console.error(`[${step}] ${message} (${percent}%)`);
}

async function main() {
  const startTime = Date.now();

  try {
    // 1. Determine movie number
    let number = null;

    if (argv.num) {
      number = argv.num.toUpperCase();
      emitProgress('initializing', `Using provided number: ${number}`, 5);
    } else if (argv['movie-path']) {
      number = extractNumberFromPath(argv['movie-path']);
      if (!number) {
        throw new Error(`Could not extract movie number from: ${argv['movie-path']}`);
      }
      emitProgress('initializing', `Extracted number: ${number}`, 5);
    } else {
      throw new Error('Either --num or --movie-path must be provided');
    }

    // 2. Create output directory
    const outputDir = path.resolve(argv.output);
    await fs.mkdir(outputDir, { recursive: true });
    emitProgress('initializing', `Output directory: ${outputDir}`, 10);

    // 3. Fetch metadata
    emitProgress('searching', 'Searching for movie...', 20);
    const metadata = await fetchMetadata(number);
    number = metadata.num; // Use the actual num from the site

    // 4. Try poster fallback if needed
    if (!metadata.poster.url) {
      emitProgress('searching', 'Trying fallback poster sources...', 25);
      const poster = await getPosterFallback(number);
      if (poster.url) {
        metadata.poster = poster;
        metadata.poster.headers = {
          referer: `https://www.javbus.com/${number}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
        };
      }
    }

    // 5. Download images
    const totalSteps = 4;
    let currentStep = 0;

    // Poster
    if (metadata.poster.url) {
      emitProgress('downloading', 'Downloading poster...', 30 + Math.floor(40 * currentStep / totalSteps));
      await downloadImage(metadata.poster, path.join(outputDir, `${number}-poster.jpg`));
      currentStep++;
      await sleep(2000 + Math.random() * 6000);
    }

    // Thumb
    if (metadata.thumb.url) {
      emitProgress('downloading', 'Downloading thumb...', 30 + Math.floor(40 * currentStep / totalSteps));
      await downloadImage(metadata.thumb, path.join(outputDir, `${number}-thumb.jpg`));
      currentStep++;
      await sleep(2000 + Math.random() * 6000);
    }

    // Fanart
    if (metadata.fanart.url) {
      emitProgress('downloading', 'Downloading fanart...', 30 + Math.floor(40 * currentStep / totalSteps));
      await downloadImage(metadata.fanart, path.join(outputDir, `${number}-fanart.jpg`));
      currentStep++;
      await sleep(2000 + Math.random() * 6000);
    }

    // Extra fanart
    if (metadata.extrafanart.length > 0) {
      const extraDir = path.join(outputDir, 'extrafanart');
      await fs.mkdir(extraDir, { recursive: true });
      emitProgress('downloading', 'Downloading extrafanart...', 30 + Math.floor(40 * currentStep / totalSteps));

      for (let i = 0; i < metadata.extrafanart.length; i++) {
        const image = metadata.extrafanart[i];
        await downloadImage(image, path.join(extraDir, `extrafanart-${i + 1}.jpg`));
        await sleep(2000 + Math.random() * 6000);
      }
    }

    // 6. Generate poster from fanart if missing
    const posterPath = path.join(outputDir, `${number}-poster.jpg`);
    const fanartPath = path.join(outputDir, `${number}-fanart.jpg`);
    const posterExists = await fs.access(posterPath).then(() => true).catch(() => false);

    if (!posterExists && await fs.access(fanartPath).then(() => true).catch(() => false)) {
      emitProgress('processing', 'Generating poster from fanart...', 75);
      await generatePosterFromFanart(fanartPath, posterPath);
    }

    // 7. Generate NFO
    emitProgress('parsing', 'Generating NFO file...', 80);
    await generateNFOFile(metadata, path.join(outputDir, `${number}.nfo`));

    emitProgress('completed', 'Processing completed successfully', 100);

    // 8. Build result
    const totalTimeMs = Date.now() - startTime;

    const result = {
      status: 'success',
      message: 'Scraping completed',
      metadata: {
        num: metadata.num,
        title: metadata.title,
        originaltitle: metadata.originaltitle,
        sorttitle: metadata.sorttitle,
        customrating: metadata.customrating,
        mpaa: metadata.mpaa,
        studio: metadata.studio,
        year: metadata.year,
        outline: metadata.outline,
        plot: metadata.plot,
        runtime: metadata.runtime,
        director: metadata.director,
        maker: metadata.maker,
        label: metadata.label,
        actors: metadata.actors.map(a => a.name),
        tags: metadata.tags,
        genres: metadata.genres,
        premiered: metadata.premiered,
        releasedate: metadata.releasedate,
        release: metadata.release,
        cover: metadata.cover,
        website: metadata.website
      },
      created_files: {
        nfo: `${number}.nfo`,
        poster: `${number}-poster.jpg`,
        fanart: `${number}-fanart.jpg`,
        thumb: `${number}-thumb.jpg`,
        screenshots: metadata.extrafanart.map((_, i) => `extrafanart/extrafanart-${i + 1}.jpg`)
      },
      statistics: {
        total_time_ms: totalTimeMs,
        api_requests: 1
      }
    };

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(`[error] ${error.message || String(error)}`);
    process.exit(1);
  }
}

main();
