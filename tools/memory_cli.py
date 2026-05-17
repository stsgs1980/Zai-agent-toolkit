#!/usr/bin/env python3
"""
Memory CLI for ZCode ADE
Works with ChromaDB for semantic search and knowledge storage.

Usage:
    python memory_cli.py init                    # Initialize database
    python memory_cli.py store <type> <content>  # Store entry
    python memory_cli.py query <query>           # Semantic search
    python memory_cli.py list <type>             # List entries
    python memory_cli.py delete <id>             # Delete entry
    python memory_cli.py export <type>           # Export entries to JSON
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict

# Default memory path
DEFAULT_MEMORY_PATH = Path.home() / ".zcode" / "memory" / "chromadb"


def parse_metadata(metadata_str: Optional[str]) -> Optional[Dict[str, str]]:
    """Parse metadata from JSON or key=value format."""
    if not metadata_str:
        return None

    # Try JSON first
    try:
        return json.loads(metadata_str)
    except json.JSONDecodeError:
        pass

    # Try key=value format (comma separated)
    result = {}
    for pair in metadata_str.split(","):
        pair = pair.strip()
        if "=" in pair:
            key, value = pair.split("=", 1)
            result[key.strip()] = value.strip()

    return result if result else None

# Entry types
ENTRY_TYPES = ["session", "knowledge", "pattern", "project", "template"]


def get_db_path() -> Path:
    """Get ChromaDB path from env or default."""
    return Path(os.environ.get("ZCODE_MEMORY_PATH", DEFAULT_MEMORY_PATH))


def ensure_db_path():
    """Ensure database directory exists."""
    db_path = get_db_path()
    db_path.mkdir(parents=True, exist_ok=True)
    return db_path


def init_db():
    """Initialize ChromaDB database."""
    try:
        import chromadb
    except ImportError:
        print("ERROR: chromadb not installed")
        print("Run: pip install chromadb")
        sys.exit(1)
    
    db_path = ensure_db_path()
    client = chromadb.PersistentClient(path=str(db_path))
    
    # Create collections for each type
    for entry_type in ENTRY_TYPES:
        client.get_or_create_collection(
            name=entry_type,
            metadata={"type": entry_type}
        )
        print(f"Created collection: {entry_type}")
    
    print(f"\nDatabase initialized at: {db_path}")
    return client


def get_client():
    """Get ChromaDB client."""
    try:
        import chromadb
    except ImportError:
        print("ERROR: chromadb not installed")
        print("Run: pip install chromadb")
        sys.exit(1)
    
    db_path = get_db_path()
    if not db_path.exists():
        print(f"ERROR: Database not found at {db_path}")
        print("Run: python memory_cli.py init")
        sys.exit(1)
    
    return chromadb.PersistentClient(path=str(db_path))


def store_entry(entry_type: str, content: str, metadata: Optional[Dict] = None):
    """Store an entry in the database."""
    if entry_type not in ENTRY_TYPES:
        print(f"ERROR: Invalid type. Valid types: {ENTRY_TYPES}")
        sys.exit(1)
    
    client = get_client()
    collection = client.get_collection(name=entry_type)
    
    # Generate ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    entry_id = f"{entry_type}_{timestamp}"
    
    # Prepare metadata
    if metadata is None:
        metadata = {}
    metadata["created_at"] = datetime.now().isoformat()
    metadata["type"] = entry_type
    
    # Add to collection
    collection.add(
        documents=[content],
        metadatas=[metadata],
        ids=[entry_id]
    )
    
    print(f"Stored: {entry_id}")
    print(f"Type: {entry_type}")
    print(f"Content preview: {content[:100]}..." if len(content) > 100 else f"Content: {content}")
    return entry_id


def query_entries(query: str, entry_type: Optional[str] = None, limit: int = 5):
    """Query entries using semantic search."""
    client = get_client()
    
    results = []
    
    if entry_type:
        if entry_type not in ENTRY_TYPES:
            print(f"ERROR: Invalid type. Valid types: {ENTRY_TYPES}")
            sys.exit(1)
        collection = client.get_collection(name=entry_type)
        result = collection.query(
            query_texts=[query],
            n_results=limit
        )
        results.append((entry_type, result))
    else:
        # Search all collections
        for et in ENTRY_TYPES:
            try:
                collection = client.get_collection(name=et)
                result = collection.query(
                    query_texts=[query],
                    n_results=limit
                )
                if result["ids"] and result["ids"][0]:
                    results.append((et, result))
            except (ValueError, KeyError, RuntimeError):
                continue
    
    # Print results
    print(f"\nSearch results for: '{query}'")
    print("=" * 50)
    
    if not results or all(not r[1]["ids"][0] for r in results):
        print("No results found")
        return
    
    for et, result in results:
        if not result["ids"][0]:
            continue
        
        print(f"\n[{et.upper()}]")
        for i, doc_id in enumerate(result["ids"][0]):
            metadata = result["metadatas"][0][i] if result["metadatas"] else {}
            document = result["documents"][0][i] if result["documents"] else ""
            distance = result["distances"][0][i] if result.get("distances") else 0
            
            print(f"\n  ID: {doc_id}")
            print(f"  Distance: {distance:.4f}")
            print(f"  Created: {metadata.get('created_at', 'N/A')}")
            print(f"  Content: {document[:200]}..." if len(document) > 200 else f"  Content: {document}")


def list_entries(entry_type: str, limit: int = 10):
    """List entries of a specific type."""
    if entry_type not in ENTRY_TYPES:
        print(f"ERROR: Invalid type. Valid types: {ENTRY_TYPES}")
        sys.exit(1)
    
    client = get_client()
    collection = client.get_collection(name=entry_type)
    
    # Get all entries
    result = collection.get(limit=limit)
    
    print(f"\nEntries in '{entry_type}' collection:")
    print("=" * 50)
    
    if not result["ids"]:
        print("No entries found")
        return
    
    for i, doc_id in enumerate(result["ids"]):
        metadata = result["metadatas"][i] if result["metadatas"] else {}
        document = result["documents"][i] if result["documents"] else ""
        
        print(f"\n[{i+1}] ID: {doc_id}")
        print(f"    Created: {metadata.get('created_at', 'N/A')}")
        print(f"    Content: {document[:100]}..." if len(document) > 100 else f"    Content: {document}")


def delete_entry(entry_id: str, entry_type: Optional[str] = None):
    """Delete an entry by ID."""
    client = get_client()
    
    if entry_type:
        if entry_type not in ENTRY_TYPES:
            print(f"ERROR: Invalid type. Valid types: {ENTRY_TYPES}")
            sys.exit(1)
        collection = client.get_collection(name=entry_type)
        collection.delete(ids=[entry_id])
        print(f"Deleted: {entry_id}")
    else:
        # Try to find and delete from any collection
        for et in ENTRY_TYPES:
            try:
                collection = client.get_collection(name=et)
                result = collection.get(ids=[entry_id])
                if result["ids"]:
                    collection.delete(ids=[entry_id])
                    print(f"Deleted: {entry_id} from {et}")
                    return
            except (ValueError, KeyError, RuntimeError):
                continue
        
        print(f"Entry not found: {entry_id}")


def export_entries(entry_type: str, output: Optional[str] = None):
    """Export entries to JSON file."""
    if entry_type not in ENTRY_TYPES:
        print(f"ERROR: Invalid type. Valid types: {ENTRY_TYPES}")
        sys.exit(1)

    client = get_client()
    collection = client.get_collection(name=entry_type)
    result = collection.get()

    data = []
    for i, doc_id in enumerate(result["ids"]):
        metadata = result["metadatas"][i] if result["metadatas"] else {}
        document = result["documents"][i] if result["documents"] else ""
        data.append({
            "id": doc_id,
            "content": document,
            "metadata": metadata
        })

    export = {"type": entry_type, "count": len(data), "entries": data}

    if output:
        output_path = Path(output)
        output_path.write_text(json.dumps(export, indent=2, ensure_ascii=False))
        print(f"Exported {len(data)} entries to {output}")
    else:
        print(json.dumps(export, indent=2, ensure_ascii=False))

    return data


def main():
    parser = argparse.ArgumentParser(
        description="Memory CLI for ZCode ADE",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python memory_cli.py init
    python memory_cli.py store session "Working on React hooks refactoring"
    python memory_cli.py store knowledge "Use useCallback for memoizing functions" --metadata category=react
    python memory_cli.py store knowledge "Project info" --metadata "project=zai,version=1.0"
    python memory_cli.py query "react hooks"
    python memory_cli.py list session
    python memory_cli.py delete session_20240101_120000
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Init command
    subparsers.add_parser("init", help="Initialize database")
    
    # Store command
    store_parser = subparsers.add_parser("store", help="Store an entry")
    store_parser.add_argument("type", choices=ENTRY_TYPES, help="Entry type")
    store_parser.add_argument("content", help="Content to store")
    store_parser.add_argument("--metadata", "-m", help="JSON metadata")
    
    # Query command
    query_parser = subparsers.add_parser("query", help="Semantic search")
    query_parser.add_argument("query", help="Search query")
    query_parser.add_argument("--type", "-t", choices=ENTRY_TYPES, help="Filter by type")
    query_parser.add_argument("--limit", "-l", type=int, default=5, help="Results limit")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List entries")
    list_parser.add_argument("type", choices=ENTRY_TYPES, help="Entry type")
    list_parser.add_argument("--limit", "-l", type=int, default=10, help="Results limit")
    
    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete an entry")
    delete_parser.add_argument("id", help="Entry ID")
    delete_parser.add_argument("--type", "-t", choices=ENTRY_TYPES, help="Entry type")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export entries to JSON")
    export_parser.add_argument("type", choices=ENTRY_TYPES, help="Entry type")
    export_parser.add_argument("--output", "-o", help="Output file path")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == "init":
        init_db()
    elif args.command == "store":
        metadata = parse_metadata(args.metadata)
        store_entry(args.type, args.content, metadata)
    elif args.command == "query":
        query_entries(args.query, args.type, args.limit)
    elif args.command == "list":
        list_entries(args.type, args.limit)
    elif args.command == "delete":
        delete_entry(args.id, args.type)
    elif args.command == "export":
        export_entries(args.type, args.output)


if __name__ == "__main__":
    main()
