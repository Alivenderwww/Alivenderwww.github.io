#!/usr/bin/env python3
"""
自动更新 Markdown 文件的 date 元数据为文件创建时间
格式: YYYY-MM-DD HH:MM
"""

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Optional, Set


GITHUB_OWNER = os.getenv("GITHUB_OWNER", "Alivenderwww")
GITHUB_REPO = os.getenv("GITHUB_REPO", "Alivenderwww.github.io")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")
GITHUB_API_ROOT = "https://api.github.com"
_GITHUB_WARNING_SHOWN: Set[str] = set()


def _format_datetime(value: datetime) -> str:
    """格式化日期为 YYYY-MM-DD HH:MM，统一使用本地时区"""
    if value.tzinfo is None:
        return value.strftime("%Y-%m-%d %H:%M")
    return value.astimezone().strftime("%Y-%m-%d %H:%M")


def _get_repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


@lru_cache(maxsize=None)
def _fetch_latest_commit_datetime(relative_path: str) -> Optional[datetime]:
    params = {
        "path": relative_path,
        "sha": GITHUB_BRANCH,
        "per_page": 1,
        "page": 1,
    }
    query = urllib.parse.urlencode(params)
    url = f"{GITHUB_API_ROOT}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/commits?{query}"

    headers = {"Accept": "application/vnd.github+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        key = f"http_{exc.code}"
        if exc.code == 403 and key not in _GITHUB_WARNING_SHOWN:
            print("Warning: GitHub API rate limit reached; falling back to local timestamps.")
            _GITHUB_WARNING_SHOWN.add(key)
        elif exc.code == 404 and key not in _GITHUB_WARNING_SHOWN:
            _GITHUB_WARNING_SHOWN.add(key)
        return None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    if not payload:
        return None

    commit_info = payload[0].get("commit", {})
    date_str = commit_info.get("author", {}).get("date") or commit_info.get("committer", {}).get("date")
    if not date_str:
        return None

    try:
        # GitHub 返回 ISO 8601（UTC）日期，例如 2024-12-31T07:12:45Z
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        return None


def _get_github_commit_date(filepath: Path) -> Optional[str]:
    try:
        relative_path = filepath.resolve().relative_to(_get_repo_root())
    except Exception:
        return None

    commit_datetime = _fetch_latest_commit_datetime(str(relative_path).replace(os.sep, "/"))
    if not commit_datetime:
        return None

    return _format_datetime(commit_datetime)


def get_file_ctime(filepath: Path) -> str:
    """返回文件的首选日期，优先使用 GitHub 上的提交日期，无法获取时退回到本地创建时间"""
    github_date = _get_github_commit_date(filepath)
    if github_date:
        return github_date

    # Windows 上 getctime 是创建时间；Linux/Mac 上需根据 stat 结果处理
    try:
        stat_info = filepath.stat()
        if hasattr(stat_info, "st_birthtime"):
            ctime = stat_info.st_birthtime
        else:
            ctime = stat_info.st_ctime
    except Exception:
        ctime = os.path.getctime(filepath)

    return datetime.fromtimestamp(ctime).strftime("%Y-%m-%d %H:%M")


def update_date_in_frontmatter(content: str, new_date: str) -> tuple[str, bool]:
    """
    更新 frontmatter 中的 date 字段
    返回: (更新后的内容, 是否有变化)
    """
    # 匹配 YAML frontmatter
    frontmatter_pattern = re.compile(r'^---\s*\n(.*?)\n---', re.DOTALL)
    match = frontmatter_pattern.match(content)
    
    if not match:
        # 没有 frontmatter，添加一个
        new_frontmatter = f"---\ndate: {new_date}\n---\n\n"
        return new_frontmatter + content, True
    
    frontmatter = match.group(1)
    
    # 检查是否已有 date 字段
    date_pattern = re.compile(r'^date:\s*.*$', re.MULTILINE)
    date_match = date_pattern.search(frontmatter)
    
    if date_match:
        # 检查日期是否需要更新
        old_date_line = date_match.group(0)
        new_date_line = f"date: {new_date}"
        
        if old_date_line.strip() == new_date_line:
            return content, False  # 日期相同，无需更新
        
        # 更新 date 字段
        new_frontmatter = date_pattern.sub(new_date_line, frontmatter)
    else:
        # 添加 date 字段
        new_frontmatter = frontmatter.rstrip() + f"\ndate: {new_date}"
    
    # 重建内容
    new_content = f"---\n{new_frontmatter}\n---" + content[match.end():]
    return new_content, True


def process_markdown_files(docs_dir: Path, exclude_patterns: list[str] = None):
    """处理所有 Markdown 文件"""
    if exclude_patterns is None:
        # exclude_patterns = ["index.md"]
        exclude_patterns = []
    
    updated_count = 0
    skipped_count = 0
    
    # 遍历 blogs 目录下的所有 md 文件
    blogs_dir = docs_dir / "blogs"
    if not blogs_dir.exists():
        print(f"警告: blogs 目录不存在: {blogs_dir}")
        return
    
    for md_file in blogs_dir.rglob("*.md"):
        # 检查是否需要排除
        if any(md_file.name == pattern for pattern in exclude_patterns):
            skipped_count += 1
            continue
        
        try:
            # 读取文件内容
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            # 获取文件创建时间
            new_date = get_file_ctime(md_file)
            
            # 更新日期
            new_content, changed = update_date_in_frontmatter(content, new_date)
            
            if changed:
                # 写回文件
                with open(md_file, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"✓ 更新: {md_file.relative_to(docs_dir)} -> {new_date}")
                updated_count += 1
            else:
                skipped_count += 1
                
        except Exception as e:
            print(f"✗ 错误处理 {md_file}: {e}")
    
    print(f"\n完成! 更新了 {updated_count} 个文件，跳过了 {skipped_count} 个文件")


def main():
    # 获取项目根目录
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    docs_dir = project_root / "docs"
    
    print(f"扫描目录: {docs_dir}")
    print("-" * 50)
    
    process_markdown_files(docs_dir)


if __name__ == "__main__":
    main()
