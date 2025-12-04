#!/usr/bin/env python3
"""
自动更新 Markdown 文件的 date 元数据为文件创建时间
格式: YYYY-MM-DD HH:MM
"""

import os
import re
from datetime import datetime
from pathlib import Path


def get_file_ctime(filepath: Path) -> str:
    """获取文件创建时间，格式化为 YYYY-MM-DD HH:MM
    
    Windows: os.path.getctime() 返回创建时间
    Linux/Mac: os.path.getctime() 返回 inode 修改时间，需要用 stat
    """
    # Windows 上 getctime 是创建时间
    # 为了跨平台兼容，也可以用 stat().st_birthtime (macOS) 或 st_ctime (Windows)
    try:
        stat_info = filepath.stat()
        # Windows 使用 st_ctime 作为创建时间
        if hasattr(stat_info, 'st_birthtime'):
            # macOS
            ctime = stat_info.st_birthtime
        else:
            # Windows: st_ctime 是创建时间
            ctime = stat_info.st_ctime
    except Exception:
        ctime = os.path.getctime(filepath)
    
    dt = datetime.fromtimestamp(ctime)
    return dt.strftime("%Y-%m-%d %H:%M")


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
