"""Scraper modules for fetching metadata from various sources."""

from jcatch_plugin.scrapers.base import BaseScraper
from jcatch_plugin.scrapers.javbus import JavBusScraper
from jcatch_plugin.scrapers.javwine import JavWineScraper
from jcatch_plugin.scrapers.www324jav import Www324JavScraper
from jcatch_plugin.scrapers.decorators import PosterDecorator, ScraperDecorator

__all__ = [
    "BaseScraper",
    "JavBusScraper",
    "JavWineScraper",
    "Www324JavScraper",
    "ScraperDecorator",
    "PosterDecorator",
]
