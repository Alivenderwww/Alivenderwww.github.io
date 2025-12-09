#!/usr/bin/env python3
"""
启动 MkDocs 服务器前自动更新日期
"""

import subprocess
import sys
from pathlib import Path

# 添加 scripts 目录到路径
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from update_dates import process_markdown_files

def main():
    project_root = script_dir.parent
    docs_dir = project_root / "docs"
    venv_python = project_root / ".venv" / "Scripts" / "mkdocs.exe"
    
    # print("=" * 50)
    # print("正在更新 Markdown 文件日期...")
    # print("=" * 50)
    
    # process_markdown_files(docs_dir)
    
    # print("\n" + "=" * 50)
    # print("启动 MkDocs 服务器...")
    # print("=" * 50 + "\n")
    
    # 启动 mkdocs serve
    subprocess.run([str(venv_python), "serve"], cwd=project_root)


if __name__ == "__main__":
    main()
