"""Scraper modules for fetching metadata from various sources."""

from scrapers.base import BaseScraper
from scrapers.javbus import JavBusScraper
from scrapers.javwine import JavWineScraper
from scrapers.www324jav import Www324JavScraper
from scrapers.decorators import PosterDecorator, ScraperDecorator

__all__ = [
    "BaseScraper",
    "JavBusScraper",
    "JavWineScraper",
    "Www324JavScraper",
    "ScraperDecorator",
    "PosterDecorator",
]
