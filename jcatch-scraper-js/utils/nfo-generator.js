import { create } from 'xmlbuilder2';
import fs from 'fs/promises';

/**
 * Escape CDATA content.
 *
 * @param {string} content - Content to escape
 * @returns {string} Escaped content
 */
function escapeCData(content) {
  if (!content) return '';
  // Replace ]]> with ]]>]]><![CDATA[
  return content.replace(/]]>/g, ']]]]><![CDATA[>');
}

/**
 * Create a CDATA-wrapped element.
 *
 * @param {Object} parent - Parent element
 * @param {string} tagName - Tag name
 * @param {string} content - Content to wrap
 * @returns {Object} The created element
 */
function addCDataElement(parent, tagName, content) {
  const elem = parent.ele(tagName);
  elem.dat(escapeCData(content));
  return elem;
}

/**
 * Generate NFO XML content from metadata.
 *
 * @param {Object} metadata - Movie metadata object
 * @returns {string} Formatted XML string
 */
export function generateNFO(metadata) {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('movie');

  // Basic information (CDATA wrapped)
  addCDataElement(root, 'title', metadata.title);
  addCDataElement(root, 'originaltitle', metadata.originaltitle);
  addCDataElement(root, 'sorttitle', metadata.sorttitle);
  root.ele('customrating').txt(metadata.customrating);
  root.ele('mpaa').txt(metadata.mpaa);

  // Studio
  root.ele('studio').txt(metadata.studio);

  // Year
  root.ele('year').txt(metadata.year ? String(metadata.year) : '');

  // Description (CDATA wrapped)
  addCDataElement(root, 'outline', metadata.outline);
  addCDataElement(root, 'plot', metadata.plot);

  // Runtime
  root.ele('runtime').txt(metadata.runtime ? String(metadata.runtime) : '');

  // Director (CDATA wrapped)
  addCDataElement(root, 'director', metadata.director);

  // Images (filenames only, not URLs)
  if (metadata.num) {
    root.ele('poster').txt(`${metadata.num}-poster.jpg`);
    root.ele('thumb').txt(`${metadata.num}-thumb.jpg`);
    root.ele('fanart').txt(`${metadata.num}-fanart.jpg`);
  }

  // Actors
  metadata.actors.forEach(actor => {
    const actorElem = root.ele('actor');
    actorElem.ele('name').txt(actor.name);
  });

  // Maker and label (CDATA wrapped)
  root.ele('maker').txt(metadata.maker);
  root.ele('label').txt(metadata.label);

  metadata.tags.forEach(tag => {
    root.ele('tag').txt(tag);
  });

  metadata.genres.forEach(genre => {
    root.ele('genre').txt(genre);
  });

  // Number (CDATA wrapped)
  root.ele('num').txt(metadata.num);

  // Dates (CDATA wrapped)
  addCDataElement(root, 'premiered', metadata.premiered);
  addCDataElement(root, 'releasedate', metadata.releasedate);
  addCDataElement(root, 'release', metadata.release);

  // URLs (CDATA wrapped)
  addCDataElement(root, 'cover', metadata.cover);
  addCDataElement(root, 'website', metadata.website);

  return root.end({ prettyPrint: true });
}

/**
 * Generate NFO file from metadata.
 *
 * @param {Object} metadata - Movie metadata object
 * @param {string} nfoPath - Path where NFO should be saved
 */
export async function generateNFOFile(metadata, nfoPath) {
  const xmlContent = generateNFO(metadata);
  await fs.mkdir(path.dirname(nfoPath), { recursive: true });
  await fs.writeFile(nfoPath, xmlContent, 'utf-8');
}

import path from 'path';
