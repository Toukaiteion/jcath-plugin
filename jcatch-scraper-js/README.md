# JCatch Scraper JS

JavaScript implementation of JAV movie metadata scraper using Playwright.

## Installation

```bash
cd jcatch-scraper-js
npm install
npx playwright install chrome
```

## Usage

### With movie file path (auto-detect number)

```bash
node index.js --movie-path /path/to/SSNI-998.mp4 --output ./output
```

### With direct movie number

```bash
node index.js --num SSNI-998 --output ./output
```

### Default output directory

If `--output` is not specified, files are saved to the current directory.

```bash
node index.js --num SSNI-998
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--movie-path` | `-m` | Path to video file | `null` |
| `--num` | `-n` | Direct movie number (e.g., SSNI-998) | `null` |
| `--output` | `-o` | Output directory | Current directory |
| `--help` | `-h` | Show help | - |

## Output Files

After successful scraping, the following files are generated:

- `{num}.nfo` - NFO metadata file
- `{num}-poster.jpg` - Poster image (cropped from fanart if not available)
- `{num}-fanart.jpg` - Cover/fanart image
- `{num}-thumb.jpg` - Thumbnail image
- `extrafanart/` - Directory containing screenshot images

## Movie Number Patterns

The scraper extracts movie numbers from filenames using these patterns:

- `SSNI-998.mp4` → `SSNI-998`
- `ssni998.mp4` → `SSNI-998`
- `FSDSS-549_HD.mp4` → `FSDSS-549`
- `/path/to/ABC-123/ABC-123.mp4` → `ABC-123`

Regex pattern: `/([A-Za-z]{2,5})-?(\d{2,3})/i`

## Progress Output

Progress notifications are sent to stderr as JSON lines:

```json
{"type":"progress","step":"initializing","message":"Using provided number: SSNI-998","percent":5}
{"type":"progress","step":"searching","message":"Searching for movie...","percent":20}
...
{"type":"progress","step":"completed","message":"Processing completed successfully","percent":100}
```

## Final Output

Final result is sent to stdout as JSON:

```json
{
  "status": "success",
  "message": "Scraping completed",
  "metadata": {
    "num": "SSNI-998",
    "title": "...",
    ...
  },
  "created_files": {
    "nfo": "SSNI-998.nfo",
    "poster": "SSNI-998-poster.jpg",
    ...
  },
  "statistics": {
    "total_time_ms": 12345,
    "api_requests": 1
  }
}
```

## Error Handling

On scraping failure, debug information is saved to `/tmp/jcatch_err_<timestamp>/`:
- `debug_screenshot.png` - Browser screenshot
- `debug_source.html` - Page HTML source

## Dependencies

- **playwright** - Browser automation
- **cheerio** - HTML parsing
- **axios** - HTTP requests
- **sharp** - Image processing
- **yargs** - CLI argument parsing
- **xmlbuilder2** - XML generation

## License

MIT
