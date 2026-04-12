"""Unified image downloader with header support."""

from pathlib import Path
from typing import Union

import requests

from jcatch_plugin.models import ImageUrl, ProxyConfig


class ImageDownloader:
    """Unified image downloader that handles headers."""

    _proxy: dict[str, str] | None = None

    @staticmethod
    def set_proxy(proxy: ProxyConfig) -> None:
        """Set proxy for all download requests.

        Args:
            proxy: ProxyConfig object with http/https settings
        """
        ImageDownloader._proxy = proxy.to_dict()

    @staticmethod
    def download(image: ImageUrl, save_path: Union[str, Path]) -> None:
        """Download an image with headers.

        Args:
            image: ImageUrl object with URL and headers
            save_path: Path where image should be saved

        Raises:
            Exception: If download fails
        """
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            response = requests.get(
                image.url,
                headers=image.headers,
                proxies=ImageDownloader._proxy,
                timeout=30
            )
            response.raise_for_status()
            save_path.write_bytes(response.content)
        except Exception as e:
            raise Exception(f"Failed to download {image.url}: {e}")
