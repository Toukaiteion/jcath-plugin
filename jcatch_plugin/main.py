"""Plugin-mode media processor with standardized JSON input/output."""

import json
import random
import shutil
import sys
import time
import traceback
from pathlib import Path
from typing import Any

from PIL import Image
from xml.etree import ElementTree as ET

from jcatch_plugin.models import MovieMetadata, ProxyConfig
from jcatch_plugin.nfo import generate_nfo
from jcatch_plugin.scrapers import JavBusScraper, PosterDecorator, JavWineScraper, Www324JavScraper
from jcatch_plugin.utils.downloader import ImageDownloader
from jcatch_plugin.utils.file import extract_number_from_path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')


def get_scraper(proxy: dict[str, str] | None = None):
    """Get configured scraper instance.

    Args:
        proxy: Dictionary with http/https proxy URLs
    """
    # 使用与原项目相同的scraper配置
    base = JavBusScraper(proxy=proxy)
    with_poster = PosterDecorator(base, Www324JavScraper(proxy=proxy), proxy=proxy)
    with_poster = PosterDecorator(with_poster, JavWineScraper(proxy=proxy), proxy=proxy)
    return with_poster


def emit_progress(step: str, message: str, percent: int) -> None:
    """Emit progress notification to stderr."""
    progress = {
        "type": "progress",
        "step": step,
        "message": message,
        "percent": percent,
    }
    print(json.dumps(progress), file=sys.stderr, flush=True)


def read_input() -> dict[str, Any]:
    """Read JSON input from stdin."""
    try:
        raw_input = sys.stdin.read().strip()
        if not raw_input:
            raise ValueError("No input provided")

        data = json.loads(raw_input)

        # Validate required fields
        if "action" not in data:
            raise ValueError("Missing required field: action")
        if "source_dir" not in data:
            raise ValueError("Missing required field: source_dir")
        if "output_dir" not in data:
            data["output_dir"] = data["source_dir"]

        return data

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON input: {e}") from e


def find_video_file(source_dir: Path) -> Path | None:
    """Find the video file in the source directory."""
    video_extensions = {".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv"}

    for ext in video_extensions:
        for path in source_dir.glob(f"*{ext}"):
            return path

    return None


def download_images(metadata: MovieMetadata, output_dir: Path, number: str) -> None:
    """Download all images and save to output directory."""
    total_steps = 4
    current_step = 0

    if metadata.poster.url:
        emit_progress(
            "downloading",
            "Downloading poster...",
            30 + int(40 * current_step / total_steps),
        )
        ImageDownloader.download(metadata.poster, output_dir / f"{number}-poster.jpg")
        current_step += 1
        time.sleep(random.uniform(2, 8))

    if metadata.thumb.url:
        emit_progress(
            "downloading",
            "Downloading thumb...",
            30 + int(40 * current_step / total_steps),
        )
        ImageDownloader.download(metadata.thumb, output_dir / f"{number}-thumb.jpg")
        current_step += 1
        time.sleep(random.uniform(2, 8))

    if metadata.fanart.url:
        emit_progress(
            "downloading",
            "Downloading fanart...",
            30 + int(40 * current_step / total_steps),
        )
        ImageDownloader.download(metadata.fanart, output_dir / f"{number}-fanart.jpg")
        current_step += 1
        time.sleep(random.uniform(2, 8))

    # Extra fanart
    if metadata.extrafanart:
        extra_dir = output_dir / "extrafanart"
        extra_dir.mkdir(exist_ok=True)
        emit_progress(
            "downloading",
            "Downloading extrafanart...",
            30 + int(40 * current_step / total_steps),
        )

        for i, image in enumerate(metadata.extrafanart, start=1):
            ImageDownloader.download(image, extra_dir / f"extrafanart-{i}.jpg")
            time.sleep(random.uniform(2, 8))


def generate_nfo_file(metadata: MovieMetadata, output_dir: Path, number: str) -> None:
    """Generate NFO file."""
    nfo_content = generate_nfo(metadata)
    nfo_path = output_dir / f"{number}.nfo"
    nfo_path.write_text(nfo_content, encoding="utf-8")


def validate_output(output_dir: Path, number: str) -> None:
    """Validate output directory integrity."""
    missing = []

    extrafanart_dir = output_dir / "extrafanart"
    if not extrafanart_dir.exists():
        missing.append("extrafanart directory")

    fanart_file = output_dir / f"{number}-fanart.jpg"
    if not fanart_file.exists():
        missing.append(f"{number}-fanart.jpg")

    thumb_file = output_dir / f"{number}-thumb.jpg"
    if not thumb_file.exists():
        missing.append(f"{number}-thumb.jpg")

    poster_file = output_dir / f"{number}-poster.jpg"
    if not poster_file.exists():
        if fanart_file.exists():
            try:
                with Image.open(fanart_file) as img:
                    width, height = img.size
                    if width > 700:
                        max_width = 379
                        crop_width = min(width // 2, max_width)
                        right_half = img.crop((width - crop_width, 0, width, height))
                        right_half.save(poster_file, quality=95)
                    else:
                        missing.append(f"{number}-poster.jpg")
            except Exception:
                missing.append(f"{number}-poster.jpg")
        else:
            missing.append(f"{number}-poster.jpg")

    nfo_file = output_dir / f"{number}.nfo"
    if not nfo_file.exists():
        missing.append(f"{number}.nfo")

    if nfo_file.exists():
        try:
            tree = ET.parse(nfo_file)
            root = tree.getroot()
            required_tags = ["title", "poster", "thumb", "fanart"]
            for tag in required_tags:
                elem = root.find(tag)
                if elem is None or not elem.text or not elem.text.strip():
                    missing.append(f"NFO {tag} tag is empty")
        except ET.ParseError:
            missing.append("NFO file parsing failed")

    if missing:
        raise ValueError(f"Validation failed, missing: {', '.join(missing)}")


def metadata_to_dict(metadata: MovieMetadata) -> dict[str, Any]:
    """Convert Movie to dictionary for JSON output - 原始processor格式."""
    return {
        "num": metadata.num,
        "title": metadata.title,
        "originaltitle": metadata.originaltitle,
        "sorttitle": metadata.sorttitle,
        "customrating": metadata.customrating,
        "mpaa": metadata.mpaa,
        "studio": metadata.studio,
        "year": metadata.year,
        "outline": metadata.outline,
        "plot": metadata.plot,
        "runtime": metadata.runtime,
        "director": metadata.director,
        "maker": metadata.maker,
        "label": metadata.label,
        "actors": [a.name for a in metadata.actors],
        "tags": metadata.tags,
        "genres": metadata.genres,
        "premiered": metadata.premiered,
        "releasedate": metadata.releasedate,
        "release": metadata.release,
        "cover": metadata.cover,
        "website": metadata.website,
    }


def get_created_files(output_dir: Path, number: str) -> dict[str, Any]:
    """Get list of created files."""
    screenshots = []
    extrafanart_dir = output_dir / "extrafanart"
    if extrafanart_dir.exists():
        for f in sorted(extrafanart_dir.glob("*.jpg")):
            screenshots.append(f"extrafanart/{f.name}")

    return {
        "nfo": f"{number}.nfo",
        "poster": f"{number}-poster.jpg",
        "fanart": f"{number}-fanart.jpg",
        "thumb": f"{number}-thumb.jpg",
        "screenshots": screenshots,
    }


def main() -> None:
    """Main entry point for plugin mode.

    Reads JSON input from stdin, processes, and writes JSON output to stdout.
    Progress notifications are sent to stderr as JSON lines.
    Exit codes: 0 for success, non-zero for failure.
    """
    start_time = time.time()
    api_requests = 0

    try:
        # 1. Read input from stdin
        input_data = read_input()

        emit_progress("initializing", "Initializing plugin...", 0)

        action = input_data["action"]
        source_dir = Path(input_data["source_dir"])
        output_dir = Path(input_data["output_dir"])
        config = input_data.get("config", {})
        media_info = input_data.get("media_info", {})

        if action != "scrape":
            raise ValueError(f"Unsupported action: {action}")

        # 支持从输入JSON读取 output_dir
        if "output_dir" in config:
            output_dir = Path(config["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)

        # 1.1 Extract proxy config (flat key-value format)
        proxy_dict = None
        http_proxy = config.get("http_proxy")
        https_proxy = config.get("https_proxy")

        if http_proxy or https_proxy:
            proxy_config = ProxyConfig(http=http_proxy, https=https_proxy)
            proxy_dict = proxy_config.to_dict()
            # Set proxy for ImageDownloader
            ImageDownloader.set_proxy(proxy_config)

        # 2. Find video file in source directory
        video_path = find_video_file(source_dir)
        if not video_path:
            raise ValueError(f"No video file found in: {source_dir}")

        emit_progress("initializing", f"Found video: {video_path.name}", 5)

        # 3. Extract movie number
        jav_key = media_info.get("num") or media_info.get("title")
        if jav_key:
            number = str(jav_key).upper()
        else:
            number = extract_number_from_path(str(video_path))
            if not number:
                raise ValueError(f"Could not extract movie number from: {video_path}")

        emit_progress("searching", f"Identified media number: {number}", 10)

        # 4. Fetch metadata
        scraper_instance = get_scraper(proxy=proxy_dict)
        emit_progress("searching", "Searching for movie...", 20)
        api_requests += 1
        metadata = scraper_instance.fetch_metadata(number)
        number = metadata.num

        try:
            # 5. Download images
            emit_progress("downloading", "Downloading images...", 30)
            download_images(metadata, output_dir, number)

            # 6. Generate NFO
            emit_progress("parsing", "Parsing data...", 70)
            generate_nfo_file(metadata, output_dir, number)

            # 7. Validate output
            emit_progress("saving", "Saving metadata...", 85)
            validate_output(output_dir, number)

            emit_progress("completed", "Processing completed successfully", 100)

            # 8. Calculate statistics
            total_time_ms = int((time.time() - start_time) * 1000)

            # 9. Build result
            result = {
                "status": "success",
                "message": "Scraping completed",
                "metadata": metadata_to_dict(metadata),
                "created_files": get_created_files(output_dir, number),
                "statistics": {
                    "total_time_ms": total_time_ms,
                    "api_requests": api_requests,
                },
            }

            # 10. Write output to stdout
            print(json.dumps(result, indent=2, ensure_ascii=False), file=sys.stdout, flush=True)

            sys.exit(0)  # Success

        except Exception as e:
            # Clean up only files created by this operation
            created_files = [
                output_dir / f"{number}-poster.jpg",
                output_dir / f"{number}-thumb.jpg",
                output_dir / f"{number}-fanart.jpg",
                output_dir / f"{number}.nfo",
                output_dir / "extrafanart"  # directory
            ]

            # Delete files and subdirectories
            for file_path in created_files:
                if file_path.exists():
                    if file_path.is_dir():
                        shutil.rmtree(file_path, ignore_errors=True)
                    else:
                        file_path.unlink(missing_ok=True)

            # Delete output_dir only if empty
            if output_dir.exists() and not any(output_dir.iterdir()):
                output_dir.rmdir()

            raise

    except BaseException as e:
        full_traceback = traceback.format_exc()
        error = {
            "type": "error",
            "message": full_traceback,
        }
        print(json.dumps(error), file=sys.stderr, flush=True)
        sys.exit(1)  # Failure


if __name__ == "__main__":
    main()
