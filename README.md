# JCatch Plugin - JAV视频元数据搜刮插件

## 概述

这是一个独立的插件，用于从多个JAV网站搜取电影元数据。插件符合标准插件规范，可以作为独立模块安装和运行。

## 功能

- 从javbus.com获取电影元数据
- 从jav.wine和www3.24-jav.com获取封面图片
- 生成NFO元数据文件
- 下载海报、缩略图、背景图和额外截图
- 标准JSON输入输出接口
- 进度通知通过stderr输出

## 安装

```bash
cd /path/to/jcatch-plugin
pip install -e .
py -3.13 -m pip install -e .
```

## 使用方式

### 作为插件运行

```bash
# 准备输入JSON
cat > input.json <<EOF
{
  "action": "scrape",
  "source_dir": "/path/to/video/directory",
  "config": {
    "output_dir": "/path/to/output/directory"
  },
  "media_info": {
    "num": "FSDSS-549"
  }
}
EOF

# 运行插件
jcatch-plugin < input.json
```

### 输入格式

```json
{
  "action": "scrape",
  "source_dir": "/path/to/movie/directory",
  "config": {
    "output_dir": "/path/to/output"
  },
  "media_info": {
    "num": "FSDSS-549"
  }
}
```

### 输出格式

```json
{
  "status": "success",
  "message": "Scraping completed",
  "metadata": {
    "num": "FSDSS-549",
    "title": "电影标题",
    "year": 2024
  },
  "created_files": {
    "nfo": "FSDSS-549.nfo",
    "poster": "FSDSS-549-poster.jpg",
    "fanart": "FSDSS-549-fanart.jpg",
    "screenshots": ["extrafanart-1.jpg", "extrafanart-2.jpg"]
  },
  "statistics": {
    "total_time_ms": 5000,
    "api_requests": 1
  }
}
```

### 进度通知

进度通知通过stderr以JSON行格式输出：

```json
{"type": "progress", "step": "searching", "message": "Searching for movie...", "percent": 10}
{"type": "progress", "step": "downloading", "message": "Downloading poster...", "percent": 50}
{"type": "progress", "step": "completed", "message": "Processing completed successfully", "percent": 100}
```

支持的进度步骤类型：
- `initializing`: 初始化中
- `searching`: 搜索中
- `downloading`: 下载资源中
- `parsing`: 解析数据中
- `saving`: 保存文件中
- `completed`: 完成

### 退出码

- `0`: 成功
- `1`: 失败

## 依赖

- Python >= 3.10
- pydantic >= 2.0.0
- requests >= 2.31.0
- beautifulsoup4 >= 4.12.0
- lxml >= 5.0.0
- selenium >= 4.0.0
- webdriver-manager >= 4.0.0
- python-dotenv >= 1.0.0
- Pillow >= 10.0.0

## 环境变量

### JCATCH_CHROME_PATH

指定Chrome浏览器的可执行文件路径。

示例：
```bash
export JCATCH_CHROME_PATH="/usr/bin/google-chrome"
```

## 项目结构

```
jcatch-plugin/
├── pyproject.toml          # 项目配置
├── plugin.json             # 插件定义
├── README.md
└── jcatch_plugin/
    ├── __init__.py
    ├── main.py              # 插件主入口
    ├── models.py            # 数据模型
    ├── nfo.py              # NFO生成
    ├── scrapers/
    │   ├── __init__.py
    │   ├── base.py          # 抽象基类
    │   ├── javbus.py        # JavBus搜刮器
    │   ├── javwine.py       # JavWine封面获取器
    │   ├── www324jav.py    # 324Jav封面获取器
    │   └── decorators/
    │       ├── __init__.py
    │       ├── base_decorator.py
    │       └── poster_decorator.py
    └── utils/
        ├── __init__.py
        ├── downloader.py      # 图片下载器
        └── file.py           # 文件工具函数
```

## 许可证

MIT License
