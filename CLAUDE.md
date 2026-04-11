# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JCatch Plugin is a standalone JAV video metadata scraper that conforms to standard plugin specifications. It scrapes movie metadata from multiple sources (javbus.com for metadata, jav.wine and www3.24-jav.com for poster images), generates NFO files, and downloads associated images.

The plugin uses a standard JSON interface:
- **Input**: JSON via stdin with `action`, `source_dir`, `config`, and `media_info`
- **Output**: JSON via stdout with status, metadata, created_files, and statistics
- **Progress**: JSON lines via stderr with `type`, `step`, `message`, `percent`

## Installation and Running

```bash
# Install the plugin (editable mode)
pip install -e .

# Run with JSON input
jcatch-plugin < input.json

# Or use environment variable for Chrome path
export JCATCH_CHROME_PATH="/path/to/chrome"
jcatch-plugin < input.json
```

## Architecture

### Scraper Composition Pattern

The scraper system uses a decorator pattern to combine multiple scrapers:

```python
# Base scraper provides metadata from JavBus
BaseScraper -> JavBusScraper (Selenium + BeautifulSoup)

# Decorators add/override specific data
PosterDecorator -> wraps base scraper and adds poster URL from JavWine or 324Jav
```

In `main.py:get_scraper()`, scrapers are chained:
1. JavBusScraper (base) - fetches all metadata
2. PosterDecorator (324Jav) - overrides poster URL if missing
3. PosterDecorator (JavWine) - additional fallback for poster URL

### Core Components

**`jcatch_plugin/main.py`**
- Main entry point for plugin mode
- JSON I/O handling via stdin/stdout
- Progress notifications via stderr
- Validation and cleanup on error

**`jcatch_plugin/models.py`**
- Pydantic models for type safety: `MovieMetadata`, `Actor`, `ImageUrl`, `ProcessConfiguration`
- `ImageUrl` includes both URL and HTTP headers (for referer auth)

**`jcatch_plugin/scrapers/`**
- `base.py`: `BaseScraper` abstract class defining the fetch_metadata interface
- `javbus.py`: `JavBusScraper` - Selenium-based scraper for javbus.com
- `javwine.py` / `www324jav.py`: Image-only scrapers for poster URLs
- `decorators/base_decorator.py`: `ScraperDecorator` for composition
- `decorators/poster_decorator.py`: `PosterDecorator` - overrides poster URL

**`jcatch_plugin/nfo.py`**
- NFO XML generation with CDATA support
- Custom `CDATAElement` class for proper XML serialization

**`jcatch_plugin/utils/`**
- `downloader.py`: `ImageDownloader` with header support
- `file.py`: `extract_number_from_path()` - extracts movie numbers from filenames/directories

## Progress Steps

Progress notifications are emitted via stderr with these step types:
- `initializing`: Setup phase (0-10%)
- `searching`: Searching/scraping metadata (10-30%)
- `downloading`: Downloading images (30-70%)
- `parsing`: Parsing/processing data (70-80%)
- `saving`: Saving files (80-90%)
- `completed`: Finished (100%)

## Dependencies

- Python >= 3.10
- Selenium 4.0+ with Chrome WebDriver (automatically managed by webdriver-manager)
- BeautifulSoup + lxml for HTML parsing
- Pillow for image processing (poster generation from fanart)
- Pydantic 2.0+ for data validation

## Environment Variables

- `JCATCH_CHROME_PATH`: Path to Chrome/Chromium binary (checked in .env first, then environment)
