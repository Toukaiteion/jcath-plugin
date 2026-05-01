import path from 'path';

/**
 * Extract movie number from file path.
 *
 * Common patterns:
 * - FSDSS-549.mp4 -> FSDSS-549
 * - /path/to/FSDSS-549/FSDSS-549.mp4 -> FSDSS-549
 * - ABC-123_HD.mp4 -> ABC-123
 * - XYZ456.mp4 -> XYZ-456 (if format matches)
 *
 * @param {string} filepath - Path to video file
 * @returns {string} Movie number (e.g., "FSDSS-549"), or empty string if not found
 */
export function extractNumberFromPath(filepath) {
  const filename = path.parse(filepath).name;

  // Pattern 1: Standard format like FSDSS-549 or FSDSS549
  // Matches: LETTERS-NUMBER (e.g., FSDSS-549, SSIS-1234)
  const match = filename.match(/([A-Za-z]{2,5})-?(\d{2,3})/i);
  if (match) {
    return `${match[1].toUpperCase()}-${match[2]}`;
  }

  // Pattern 2: Directory name might contain number
  const parent = path.basename(path.dirname(filepath));
  const parentMatch = parent.match(/([A-Za-z]{2,5})-?(\d{2,3})/i);
  if (parentMatch) {
    return `${parentMatch[1].toUpperCase()}-${parentMatch[2]}`;
  }

  return '';
}
