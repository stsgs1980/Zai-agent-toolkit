#!/usr/bin/env python3
"""
Folder Indexer - Creates index files for directories
Scans folders and creates _index.json with descriptions for easy navigation.

Usage:
    python folder_indexer.py scan <path>              # Scan and create index
    python folder_indexer.py update <path>            # Update existing index
    python folder_indexer.py search <path> <query>    # Search in index
    python folder_indexer.py list <path>              # List all items
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict

# Default index file name
INDEX_FILE = "_index.json"

# File types and their categories
FILE_CATEGORIES = {
    "documents": [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf", ".odt"],
    "spreadsheets": [".xls", ".xlsx", ".csv", ".ods"],
    "presentations": [".ppt", ".pptx", ".odp"],
    "images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"],
    "code": [".py", ".js", ".ts", ".java", ".cpp", ".c", ".go", ".rs", ".rb"],
    "config": [".json", ".yaml", ".yml", ".toml", ".ini", ".cfg"],
    "archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "media": [".mp3", ".mp4", ".wav", ".avi", ".mkv", ".mov"],
}

# Directories to skip
SKIP_DIRS = {".git", ".svn", "__pycache__", "node_modules", ".venv", "venv", ".idea", ".vscode"}


def get_file_category(ext: str) -> str:
    """Get category for file extension."""
    ext = ext.lower()
    for category, extensions in FILE_CATEGORIES.items():
        if ext in extensions:
            return category
    return "other"


def get_file_size(path: Path) -> str:
    """Get human-readable file size."""
    try:
        size = path.stat().st_size
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f}{unit}"
            size /= 1024
        return f"{size:.1f}TB"
    except (OSError, PermissionError):
        return "N/A"


def scan_directory(path: Path, max_depth: int = 3, current_depth: int = 0) -> Dict[str, Any]:
    """Scan directory and build index."""
    items = []
    total_files = 0
    total_dirs = 0

    try:
        entries = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return {"error": "Permission denied"}

    for entry in entries:
        # Skip hidden files and index file
        if entry.name.startswith(".") or entry.name == INDEX_FILE:
            continue

        if entry.is_file():
            total_files += 1
            item = {
                "name": entry.name,
                "type": "file",
                "extension": entry.suffix.lower(),
                "category": get_file_category(entry.suffix),
                "size": get_file_size(entry),
                "modified": datetime.fromtimestamp(entry.stat().st_mtime).isoformat()[:10],
                "description": "",  # To be filled manually or by AI
                "tags": []
            }
            items.append(item)

        elif entry.is_dir():
            # Skip common non-essential directories
            if entry.name in SKIP_DIRS:
                continue

            total_dirs += 1

            # Recursively scan subdirectories (limited depth)
            sub_items = []
            sub_files = 0
            sub_dirs = 0

            if current_depth < max_depth - 1:
                sub_data = scan_directory(entry, max_depth, current_depth + 1)
                if "error" not in sub_data:
                    sub_items = sub_data.get("items", [])
                    sub_files = sub_data.get("total_files", 0)
                    sub_dirs = sub_data.get("total_dirs", 0)

            item = {
                "name": entry.name,
                "type": "directory",
                "items_count": len([i for i in sub_items if i.get("type") == "file"]) if sub_items else 0,
                "subdirs_count": len([i for i in sub_items if i.get("type") == "directory"]) if sub_items else 0,
                "modified": datetime.fromtimestamp(entry.stat().st_mtime).isoformat()[:10],
                "description": "",
                "tags": [],
                "items": sub_items if current_depth < max_depth - 1 else []
            }
            items.append(item)
            total_files += sub_files
            total_dirs += sub_dirs

    return {
        "items": items,
        "total_files": total_files,
        "total_dirs": total_dirs
    }


def create_index(path: Path, max_depth: int = 3) -> Dict[str, Any]:
    """Create index for directory."""
    if not path.exists():
        print(f"ERROR: Path not found: {path}")
        return {}

    if not path.is_dir():
        print(f"ERROR: Not a directory: {path}")
        return {}

    print(f"Scanning: {path}")
    scan_result = scan_directory(path, max_depth)

    index = {
        "folder": path.name,
        "path": str(path.absolute()),
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat(),
        "total_files": scan_result["total_files"],
        "total_dirs": scan_result["total_dirs"],
        "categories": {},
        "items": scan_result["items"]
    }

    # Count by category
    for item in scan_result["items"]:
        if item["type"] == "file":
            cat = item.get("category", "other")
            index["categories"][cat] = index["categories"].get(cat, 0) + 1

    return index


def save_index(path: Path, index: Dict) -> Path:
    """Save index to file."""
    index_path = path / INDEX_FILE
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    return index_path


def load_index(path: Path) -> Optional[Dict]:
    """Load existing index."""
    index_path = path / INDEX_FILE
    if index_path.exists():
        return json.loads(index_path.read_text(encoding="utf-8"))
    return None


def update_index(path: Path, max_depth: int = 3) -> Dict:
    """Update existing index, preserving descriptions and tags."""
    old_index = load_index(path)

    # Create new index
    new_index = create_index(path, max_depth)
    if not new_index:
        return {}

    # Preserve descriptions and tags from old index
    if old_index and "items" in old_index:
        old_items = {item["name"]: item for item in old_index["items"]}

        for item in new_index["items"]:
            if item["name"] in old_items:
                old_item = old_items[item["name"]]
                # Preserve user-added data
                if old_item.get("description"):
                    item["description"] = old_item["description"]
                if old_item.get("tags"):
                    item["tags"] = old_item["tags"]

    return new_index


def search_index(path: Path, query: str) -> List[Dict]:
    """Search in index."""
    index = load_index(path)
    if not index:
        print("No index found. Run 'scan' first.")
        return []

    query = query.lower()
    results = []

    def search_items(items: List[Dict], parent: str = ""):
        for item in items:
            # Search in name and description
            if query in item["name"].lower() or query in item.get("description", "").lower():
                result = item.copy()
                result["path"] = f"{parent}/{item['name']}" if parent else item["name"]
                results.append(result)

            # Search in tags
            if query in [t.lower() for t in item.get("tags", [])]:
                result = item.copy()
                result["path"] = f"{parent}/{item['name']}" if parent else item["name"]
                result["matched_tag"] = True
                results.append(result)

            # Search in subdirectories
            if item["type"] == "directory" and "items" in item:
                search_items(item["items"], item["name"])

    search_items(index["items"])
    return results


def list_items(path: Path, category: Optional[str] = None) -> List[Dict]:
    """List items in index, optionally filtered by category."""
    index = load_index(path)
    if not index:
        print("No index found. Run 'scan' first.")
        return []

    results = []

    def collect_items(items: List[Dict]):
        for item in items:
            if category is None or item.get("category") == category:
                results.append(item)
            if item["type"] == "directory" and "items" in item:
                collect_items(item["items"])

    collect_items(index["items"])
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Folder Indexer - Create and manage folder indexes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python folder_indexer.py scan ./documents
    python folder_indexer.py scan ./projects --depth 2
    python folder_indexer.py update ./documents
    python folder_indexer.py search ./documents "contract"
    python folder_indexer.py list ./documents --category documents
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Scan command
    scan_parser = subparsers.add_parser("scan", help="Create new index")
    scan_parser.add_argument("path", help="Directory to scan")
    scan_parser.add_argument("--depth", "-d", type=int, default=3, help="Max scan depth (default: 3)")

    # Update command
    update_parser = subparsers.add_parser("update", help="Update existing index")
    update_parser.add_argument("path", help="Directory to update")
    update_parser.add_argument("--depth", "-d", type=int, default=3, help="Max scan depth")

    # Search command
    search_parser = subparsers.add_parser("search", help="Search in index")
    search_parser.add_argument("path", help="Directory with index")
    search_parser.add_argument("query", help="Search query")

    # List command
    list_parser = subparsers.add_parser("list", help="List items in index")
    list_parser.add_argument("path", help="Directory with index")
    list_parser.add_argument("--category", "-c", help="Filter by category")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    path = Path(args.path).resolve()

    if args.command == "scan":
        index = create_index(path, args.depth)
        if index:
            index_path = save_index(path, index)
            print(f"\nIndex created: {index_path}")
            print(f"Files: {index['total_files']}, Dirs: {index['total_dirs']}")
            print(f"Categories: {index['categories']}")

    elif args.command == "update":
        index = update_index(path, args.depth)
        if index:
            index_path = save_index(path, index)
            print(f"\nIndex updated: {index_path}")
            print(f"Files: {index['total_files']}, Dirs: {index['total_dirs']}")

    elif args.command == "search":
        results = search_index(path, args.query)
        if results:
            print(f"\nFound {len(results)} results for '{args.query}':\n")
            for r in results:
                print(f"  [{r['type']}] {r.get('path', r['name'])}")
                if r.get("description"):
                    print(f"      {r['description']}")
        else:
            print(f"No results for '{args.query}'")

    elif args.command == "list":
        results = list_items(path, args.category)
        if results:
            print(f"\n{len(results)} items" + (f" in category '{args.category}'" if args.category else ""))
            for r in results[:20]:  # Limit output
                print(f"  [{r['category']}] {r['name']}")
            if len(results) > 20:
                print(f"  ... and {len(results) - 20} more")
        else:
            print("No items found")


if __name__ == "__main__":
    main()
