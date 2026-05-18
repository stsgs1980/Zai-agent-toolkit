#!/usr/bin/env python3
"""
Folder Indexer - Creates index files for directories
Scans folders and creates _index.json with descriptions for easy navigation.
Optionally creates graph edges (parent_dir, imports, depends_on) via GraphEngine.

Usage:
    python folder_indexer.py scan <path> [--graph]                      # Scan and create index
    python folder_indexer.py update <path> [--graph]                    # Update existing index
    python folder_indexer.py search <path> <query>                      # Search in index
    python folder_indexer.py list <path>                                # List all items
    python folder_indexer.py analyze-imports <path> [--graph]           # Analyze import relationships
    python folder_indexer.py analyze-deps <path> [--graph]              # Analyze package dependencies
    python folder_indexer.py graph-scan <path> [--depth 3] [--no-imports] [--no-deps]  # Full graph scan
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

# Import GraphEngine from the same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from graph_engine import GraphEngine
    _GRAPH_AVAILABLE = True
except ImportError:
    _GRAPH_AVAILABLE = False

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

# Import regex patterns (regex-based, no AST dependencies)
python_import_re = re.compile(
    r'^\s*(?:from\s+(\S+)\s+import|import\s+([^\n,]+))',
    re.MULTILINE,
)

js_import_re = re.compile(
    r"""(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))""",
    re.MULTILINE,
)

rust_use_re = re.compile(
    r'^\s*(?:use\s+|mod\s+)([^\s;]+)',
    re.MULTILINE,
)

# Source file extensions for import analysis
SOURCE_EXTENSIONS = {
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".rs": "rust",
}

# Dependency files and their parsers
DEP_FILES = {
    "package.json": "node",
    "requirements.txt": "python",
    "Cargo.toml": "rust",
}


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


# ── Graph Integration Functions ─────────────────────────────────────


def _get_graph_engine() -> Optional[Any]:
    """Get a GraphEngine instance, or None if unavailable."""
    if not _GRAPH_AVAILABLE:
        print("ERROR: graph_engine.py not available. Ensure networkx is installed.")
        return None
    engine = GraphEngine()
    engine.load()
    return engine


def _relative_path(file_path: Path, root: Path) -> str:
    """Compute a project-relative path using forward slashes."""
    try:
        return str(file_path.relative_to(root)).replace(os.sep, "/")
    except ValueError:
        return str(file_path).replace(os.sep, "/")


def collect_files(path: Path, max_depth: int = 10, current_depth: int = 0) -> List[Path]:
    """Recursively collect all files under path, respecting SKIP_DIRS."""
    files: List[Path] = []
    if current_depth >= max_depth:
        return files
    try:
        entries = sorted(path.iterdir(), key=lambda x: x.name.lower())
    except (PermissionError, OSError):
        return files

    for entry in entries:
        if entry.name.startswith(".") or entry.name == INDEX_FILE:
            continue
        if entry.is_file():
            files.append(entry)
        elif entry.is_dir():
            if entry.name in SKIP_DIRS:
                continue
            files.extend(collect_files(entry, max_depth, current_depth + 1))
    return files


def add_parent_dir_edges(engine: Any, path: Path, max_depth: int = 10) -> int:
    """Add parent_dir edges for every file found under path.

    For each file, creates an edge: file_node -> dir_node with type 'parent_dir'.
    Also creates edges for nested directories -> their parent directories.
    Node IDs are project-relative paths (e.g. 'src/main.ts', 'src').

    Returns the number of edges added.
    """
    edge_count = 0
    root = path

    def _walk(current: Path, depth: int):
        nonlocal edge_count
        if depth >= max_depth:
            return
        try:
            entries = sorted(current.iterdir(), key=lambda x: x.name.lower())
        except (PermissionError, OSError):
            return

        for entry in entries:
            if entry.name.startswith(".") or entry.name == INDEX_FILE:
                continue

            if entry.is_file():
                file_rel = _relative_path(entry, root)
                dir_rel = _relative_path(current, root)
                if engine.add_edge(file_rel, dir_rel, "parent_dir", metadata={"source": "folder_indexer"}):
                    edge_count += 1

            elif entry.is_dir():
                if entry.name in SKIP_DIRS:
                    continue
                dir_rel = _relative_path(entry, root)
                parent_rel = _relative_path(current, root)
                if dir_rel != parent_rel:  # Avoid self-edge on root
                    if engine.add_edge(dir_rel, parent_rel, "parent_dir", metadata={"source": "folder_indexer"}):
                        edge_count += 1
                _walk(entry, depth + 1)

    _walk(path, 0)
    return edge_count


def _resolve_python_import(module_name: str, root: Path) -> Optional[str]:
    """Try to resolve a Python module name to a project-relative file path.

    Examples:
        'auth' -> 'auth.py' or 'auth/__init__.py'
        'package.sub' -> 'package/sub.py' or 'package/sub/__init__.py'
    """
    # Convert dotted module to path
    parts = module_name.split(".")
    rel = "/".join(parts)

    # Try direct .py file
    candidate = root / f"{rel}.py"
    if candidate.is_file():
        return _relative_path(candidate, root)

    # Try package __init__.py
    candidate = root / rel / "__init__.py"
    if candidate.is_file():
        return _relative_path(candidate, root)

    # Return the dotted path as-is (node may exist from other sources)
    return rel


def _resolve_js_import(import_path: str, source_file: Path, root: Path) -> Optional[str]:
    """Try to resolve a JS/TS import path to a project-relative file path.

    Handles relative ('./lib/auth') and bare specifiers.
    """
    if import_path.startswith("."):
        # Relative import - resolve from source file's directory
        base = source_file.parent
        rel_import = import_path
        # Remove leading ./ or ../
        target = (base / rel_import).resolve()
        # Try with extensions
        for ext in [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]:
            candidate = Path(str(target) + ext)
            if candidate.is_file():
                return _relative_path(candidate, root)
        # Try index files
        for ext in [".ts", ".tsx", ".js", ".jsx"]:
            candidate = target / f"index{ext}"
            if candidate.is_file():
                return _relative_path(candidate, root)
        # Return relative path as-is if not found locally
        try:
            return _relative_path(target, root)
        except ValueError:
            return import_path
    else:
        # Bare specifier (e.g. 'react', 'lodash') - likely external
        # Still create edge, but node may not map to a local file
        return import_path


def analyze_imports_for_path(path: Path, engine: Optional[Any] = None) -> Tuple[int, int]:
    """Analyze source files under path for import relationships.

    Creates 'imports' edges: source_file -> imported_module.
    If engine is None, only counts imports without writing to graph.

    Returns:
        (files_analyzed, edges_added)
    """
    files_analyzed = 0
    edges_added = 0
    root = path

    source_files = collect_files(path)
    for source_file in source_files:
        lang = SOURCE_EXTENSIONS.get(source_file.suffix.lower())
        if lang is None:
            continue

        try:
            content = source_file.read_text(encoding="utf-8", errors="replace")
        except (OSError, PermissionError):
            continue

        source_rel = _relative_path(source_file, root)
        files_analyzed += 1

        if lang == "python":
            for match in python_import_re.finditer(content):
                module = match.group(1) or match.group(2)
                if not module:
                    continue
                # Handle 'import X, Y' by taking the first module
                module = module.strip().split(",")[0].strip()
                # Handle 'from . import X' (relative imports)
                if module.startswith("."):
                    continue
                target = _resolve_python_import(module, root)
                if target:
                    if engine is None:
                        edges_added += 1
                    elif engine.add_edge(
                        source_rel, target, "imports",
                        metadata={"source": "folder_indexer", "lang": "python", "raw": module},
                    ):
                        edges_added += 1

        elif lang in ("typescript", "javascript"):
            for match in js_import_re.finditer(content):
                import_path = match.group(1) or match.group(2)
                if not import_path:
                    continue
                target = _resolve_js_import(import_path, source_file, root)
                if target:
                    if engine is None:
                        edges_added += 1
                    elif engine.add_edge(
                        source_rel, target, "imports",
                        metadata={"source": "folder_indexer", "lang": lang, "raw": import_path},
                    ):
                        edges_added += 1

        elif lang == "rust":
            for match in rust_use_re.finditer(content):
                use_path = match.group(1)
                if not use_path:
                    continue
                # Convert crate:: paths to relative
                if use_path.startswith("crate::"):
                    use_path = use_path[len("crate::"):]
                # Convert :: to /
                target = use_path.replace("::", "/")
                # Try to find a .rs file
                candidate = root / f"{target}.rs"
                if candidate.is_file():
                    target = _relative_path(candidate, root)
                if engine is None:
                    edges_added += 1
                elif engine.add_edge(
                    source_rel, target, "imports",
                    metadata={"source": "folder_indexer", "lang": "rust", "raw": match.group(1)},
                ):
                    edges_added += 1

    return files_analyzed, edges_added


def analyze_deps_for_path(path: Path, engine: Optional[Any] = None) -> Tuple[int, int]:
    """Analyze package dependency files under path.

    Creates 'depends_on' edges: project -> dependency.
    If engine is None, only counts dependencies without writing to graph.

    Returns:
        (dep_files_found, edges_added)
    """
    dep_files_found = 0
    edges_added = 0
    root = path
    project_node = _relative_path(path, path)  # Root dir name (or ".")

    dep_files = collect_files(path)
    for dep_file in dep_files:
        if dep_file.name not in DEP_FILES:
            continue

        dep_files_found += 1
        dep_rel = _relative_path(dep_file, root)
        # Use the directory containing the dep file as the source node
        dep_dir_rel = _relative_path(dep_file.parent, root)

        try:
            content = dep_file.read_text(encoding="utf-8", errors="replace")
        except (OSError, PermissionError):
            continue

        dep_type = DEP_FILES[dep_file.name]

        if dep_type == "node" and dep_file.name == "package.json":
            try:
                pkg = json.loads(content)
                for section in ("dependencies", "devDependencies"):
                    for name, version in pkg.get(section, {}).items():
                        meta = {"source": "folder_indexer", "type": "node", "version": str(version)}
                        if section == "devDependencies":
                            meta["dev"] = True
                        if engine is None:
                            edges_added += 1
                        elif engine.add_edge(dep_dir_rel, name, "depends_on", metadata=meta):
                            edges_added += 1
            except json.JSONDecodeError:
                print(f"  WARNING: Could not parse {dep_rel}")

        elif dep_type == "python" and dep_file.name == "requirements.txt":
            for line in content.splitlines():
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("-"):
                    continue
                # Extract package name (handle ==, >=, ~=, etc.)
                pkg_name = re.split(r'[=<>!~\[]', line)[0].strip()
                if pkg_name:
                    version_hint = line[len(pkg_name):].strip()
                    meta = {"source": "folder_indexer", "type": "python", "spec": version_hint}
                    if engine is None:
                        edges_added += 1
                    elif engine.add_edge(dep_dir_rel, pkg_name, "depends_on", metadata=meta):
                        edges_added += 1

        elif dep_type == "rust" and dep_file.name == "Cargo.toml":
            # Simple parser: find [dependencies] section
            in_deps = False
            for line in content.splitlines():
                stripped = line.strip()
                if stripped.startswith("["):
                    in_deps = stripped == "[dependencies]" or stripped.startswith("[dependencies.")
                    continue
                if in_deps and "=" in stripped:
                    pkg_name = stripped.split("=")[0].strip()
                    if pkg_name and not pkg_name.startswith("#"):
                        meta = {"source": "folder_indexer", "type": "rust", "raw": stripped}
                        if engine is None:
                            edges_added += 1
                        elif engine.add_edge(dep_dir_rel, pkg_name, "depends_on", metadata=meta):
                            edges_added += 1

    return dep_files_found, edges_added


# ── Main ───────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="Folder Indexer - Create and manage folder indexes with graph auto-edges",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python folder_indexer.py scan ./documents
    python folder_indexer.py scan ./projects --depth 2 --graph
    python folder_indexer.py update ./documents --graph
    python folder_indexer.py search ./documents "contract"
    python folder_indexer.py list ./documents --category documents
    python folder_indexer.py analyze-imports ./src --graph
    python folder_indexer.py analyze-deps ./project --graph
    python folder_indexer.py graph-scan ./project --depth 3
    python folder_indexer.py graph-scan ./project --no-deps
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Scan command
    scan_parser = subparsers.add_parser("scan", help="Create new index")
    scan_parser.add_argument("path", help="Directory to scan")
    scan_parser.add_argument("--depth", "-d", type=int, default=3, help="Max scan depth (default: 3)")
    scan_parser.add_argument("--graph", action="store_true", help="Create parent_dir graph edges")

    # Update command
    update_parser = subparsers.add_parser("update", help="Update existing index")
    update_parser.add_argument("path", help="Directory to update")
    update_parser.add_argument("--depth", "-d", type=int, default=3, help="Max scan depth")
    update_parser.add_argument("--graph", action="store_true", help="Create parent_dir graph edges")

    # Search command
    search_parser = subparsers.add_parser("search", help="Search in index")
    search_parser.add_argument("path", help="Directory with index")
    search_parser.add_argument("query", help="Search query")

    # List command
    list_parser = subparsers.add_parser("list", help="List items in index")
    list_parser.add_argument("path", help="Directory with index")
    list_parser.add_argument("--category", "-c", help="Filter by category")

    # Analyze-imports command
    imports_parser = subparsers.add_parser("analyze-imports", help="Analyze import/dependency relationships in source files")
    imports_parser.add_argument("path", help="Directory to analyze")
    imports_parser.add_argument("--graph", action="store_true", help="Write import edges to graph")

    # Analyze-deps command
    deps_parser = subparsers.add_parser("analyze-deps", help="Analyze package dependency files")
    deps_parser.add_argument("path", help="Directory to analyze")
    deps_parser.add_argument("--graph", action="store_true", help="Write dependency edges to graph")

    # Graph-scan command (combines everything)
    graph_scan_parser = subparsers.add_parser("graph-scan", help="Full scan: index + parent_dir + imports + deps")
    graph_scan_parser.add_argument("path", help="Directory to scan")
    graph_scan_parser.add_argument("--depth", "-d", type=int, default=3, help="Max scan depth (default: 3)")
    graph_scan_parser.add_argument("--no-imports", action="store_true", help="Skip import analysis")
    graph_scan_parser.add_argument("--no-deps", action="store_true", help="Skip dependency analysis")

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

        if getattr(args, "graph", False):
            engine = _get_graph_engine()
            if engine:
                edge_count = add_parent_dir_edges(engine, path, args.depth)
                engine.save()
                print(f"Graph: added {edge_count} parent_dir edges")

    elif args.command == "update":
        index = update_index(path, args.depth)
        if index:
            index_path = save_index(path, index)
            print(f"\nIndex updated: {index_path}")
            print(f"Files: {index['total_files']}, Dirs: {index['total_dirs']}")

        if getattr(args, "graph", False):
            engine = _get_graph_engine()
            if engine:
                edge_count = add_parent_dir_edges(engine, path, args.depth)
                engine.save()
                print(f"Graph: added {edge_count} parent_dir edges")

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

    elif args.command == "analyze-imports":
        engine = _get_graph_engine() if getattr(args, "graph", False) else None
        if getattr(args, "graph", False) and engine is None:
            print("ERROR: Cannot write to graph -- graph_engine unavailable")
            sys.exit(1)

        files_analyzed, edges_added = analyze_imports_for_path(path, engine)
        print(f"\nImport analysis complete:")
        print(f"  Source files analyzed: {files_analyzed}")
        print(f"  Import edges found:    {edges_added}")

        if engine:
            engine.save()
            print(f"  Edges written to graph: {edges_added}")

    elif args.command == "analyze-deps":
        engine = _get_graph_engine() if getattr(args, "graph", False) else None
        if getattr(args, "graph", False) and engine is None:
            print("ERROR: Cannot write to graph -- graph_engine unavailable")
            sys.exit(1)

        dep_files, edges_added = analyze_deps_for_path(path, engine)
        print(f"\nDependency analysis complete:")
        print(f"  Dependency files found: {dep_files}")
        print(f"  Dependency edges found: {edges_added}")

        if engine:
            engine.save()
            print(f"  Edges written to graph: {edges_added}")

    elif args.command == "graph-scan":
        # Step 1: Create _index.json (existing behavior)
        index = create_index(path, args.depth)
        if index:
            index_path = save_index(path, index)
            print(f"\nIndex created: {index_path}")
            print(f"Files: {index['total_files']}, Dirs: {index['total_dirs']}")

        # Step 2: Get graph engine
        engine = _get_graph_engine()
        if not engine:
            print("ERROR: graph_engine unavailable, cannot create graph edges")
            sys.exit(1)

        total_edges = 0

        # Step 3: Add parent_dir edges
        parent_edges = add_parent_dir_edges(engine, path, args.depth)
        total_edges += parent_edges
        print(f"Graph: {parent_edges} parent_dir edges added")

        # Step 4: Optionally analyze imports
        if not args.no_imports:
            files_analyzed, import_edges = analyze_imports_for_path(path, engine)
            total_edges += import_edges
            print(f"Graph: {import_edges} imports edges added ({files_analyzed} files analyzed)")

        # Step 5: Optionally analyze dependencies
        if not args.no_deps:
            dep_files, dep_edges = analyze_deps_for_path(path, engine)
            total_edges += dep_edges
            print(f"Graph: {dep_edges} depends_on edges added ({dep_files} dep files found)")

        # Step 6: Save and report
        engine.save()
        print(f"\nGraph-scan complete: {total_edges} total edges created")
        stats = engine.stats()
        print(f"Graph stats: {stats['nodes']} nodes, {stats['edges']} edges total")


if __name__ == "__main__":
    main()
