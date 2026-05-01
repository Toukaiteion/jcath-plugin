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

## 前置要求

- Python 3.10+ (建议 3.13)
- pip Chrome 浏览器 (用于 Selenium)

## 安装

### 方法一：源码直接运行

**Windows:**
```bash
# 安装依赖
py -3.13 -m pip install pydantic requests beautifulsoup4 lxml selenium webdriver-manager python-dotenv Pillow

# 运行
py -3.13 -m jcatch_plugin.main < input.json
```

**Linux/macOS:**
```bash
# 安装依赖
python3 -m pip install pydantic requests beautifulsoup4 lxml selenium webdriver-manager python-dotenv Pillow

# 运行
python3 -m jcatch_plugin.main < input.json
```

### 方法二：打包成 whl 后安装

**Windows:**
```bash
# 安装构建工具
py -3.13 -m pip install build

# 构建 wheel 包
py -3.13 -m build

# 安装 wheel 包
py -3.13 -m pip install dist/jcatch_plugin-*.whl

# 运行
jcatch-plugin < input.json
```

**Linux/macOS:**
```bash
# 安装构建工具
python3 -m pip install build

# 构建 wheel 包
python3 -m build

# 安装 wheel 包
python3 -m pip install dist/jcatch_plugin-*.whl

# 运行
jcatch-plugin < input.json
```

### 方法三：打包成可执行文件

使用项目提供的 `jcatch.spec` 配置文件打包，确保所有依赖正确包含：

**Windows:**
```bash
# 安装 PyInstaller
py -3.13 -m pip install pyinstaller

# 使用 spec 文件打包（推荐）
py -3.13 -m PyInstaller jcatch.spec --clean

# 运行（可执行文件在 dist/jcatch.exe）
dist\jcatch.exe < input.json
```

**Linux/macOS:**
```bash
# 安装 PyInstaller
python3 -m pip install pyinstaller

# 使用 spec 文件打包（推荐）
python3 -m PyInstaller jcatch.spec --clean

# 运行（可执行文件在 dist/jcatch）
./dist/jcatch < input.json
```

> **提示**: 使用 `jcatch.spec` 文件打包可以自动包含所有必要的依赖项（如 PIL/Pillow、Selenium、BeautifulSoup 等），避免运行时模块缺失错误。

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

### 代理配置

在 `config` 中添加 `HTTP_PROXY` 和 `HTTPS_PROXY` 来配置代理：

```json
{
  "action": "scrape",
  "source_dir": "/path/to/movie/directory",
  "config": {
    "output_dir": "/path/to/output",
    "HTTP_PROXY": "http://proxy.example.com:8080",
    "HTTPS_PROXY": "http://proxy.example.com:8080"
  },
  "media_info": {
    "num": "FSDSS-549"
  }
}
```

如果只需要 HTTP 代理：
```json
{
  "config": {
    "HTTP_PROXY": "http://proxy.example.com:8080"
  }
}
```

如果只需要 HTTPS 代理：
```json
{
  "config": {
    "HTTPS_PROXY": "http://proxy.example.com:8080"
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

## 故障排除

### Chrome 浏览器未找到

**错误信息**: `Chrome browser not found`

**解决方案**: 设置 `JCATCH_CHROME_PATH` 环境变量或安装 Chrome 浏览器

```bash
# Windows
set JCATCH_CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"

# Linux/macOS
export JCATCH_CHROME_PATH="/usr/bin/google-chrome"
```

### 网络连接超时

**错误信息**: `Connection timeout` 或 `Max retries exceeded`

**解决方案**:
- 检查网络连接
- 如果使用代理，配置系统代理环境变量
- 检查防火墙设置

### 找不到电影编号

**错误信息**: `Could not extract movie number`

**解决方案**: 确保视频文件名或目录名包含有效的 JAV 编号（如 FSDSS-549、ABP-123 等）

### Selenium WebDriver 问题

**错误信息**: `WebDriverException`

**解决方案**:
- 确保已安装 webdriver-manager
- 确保网络可以访问 ChromeDriver 下载源
- webdriver-manager 会自动下载和管理 ChromeDriver

### PyInstaller 打包后运行失败

**错误信息**: 模块导入错误或缺少依赖（如 `ModuleNotFoundError: No module named 'PIL'`）

**解决方案**:
- 使用项目提供的 `jcatch.spec` 配置文件打包，它已包含所有必要的 `hidden-import`：
  ```bash
  python3 -m PyInstaller jcatch.spec --clean
  ```
- 确保打包前已安装所有依赖：`pip install pydantic requests beautifulsoup4 lxml selenium webdriver-manager python-dotenv Pillow pyinstaller`
- 如需调试，添加 `--log-level DEBUG` 参数查看详细日志

## 许可证

MIT License
