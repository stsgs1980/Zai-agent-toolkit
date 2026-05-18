#!/usr/bin/env python3
"""
Memory CLI for ZCode ADE
Works with ChromaDB for semantic search and knowledge storage.
Includes graph layer (NetworkX) for relationship traversal.

Usage:
    python memory_cli.py init                         # Initialize database
    python memory_cli.py store <type> <content>       # Store entry (+ auto graph edge)
    python memory_cli.py query <query>                # Semantic search
    python memory_cli.py list <type>                  # List entries
    python memory_cli.py delete <id>                  # Delete entry
    python memory_cli.py export <type>                # Export entries to JSON
    python memory_cli.py graph add-edge               # Add graph edge
    python memory_cli.py graph remove-edge            # Remove graph edge
    python memory_cli.py graph query-path             # Shortest path
    python memory_cli.py graph neighbors <node>       # Connected nodes
    python memory_cli.py graph subgraph               # Subgraph by tag
    python memory_cli.py graph viz [--filter-type T]  # Visualize (pyvis HTML)
    python memory_cli.py graph viz --focus NODE       # Focus on node neighborhood
    python memory_cli.py graph serve [--port 8765]    # Live viz server with auto-refresh
    python memory_cli.py graph export                 # Export JSON for dashboard
    python memory_cli.py graph stats                  # Graph statistics
    python memory_cli.py graph validate               # Integrity check
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
ENTRY_TYPES = ["session", "knowledge", "pattern", "project", "template", "command"]


def get_db_path() -> Path:
    """Get ChromaDB path from env or default."""
    return Path(os.environ.get("ZCODE_MEMORY_PATH", DEFAULT_MEMORY_PATH))


def ensure_db_path():
    """Ensure database directory exists."""
    db_path = get_db_path()
    db_path.mkdir(parents=True, exist_ok=True)
    return db_path


def get_graph_engine():
    """Get GraphEngine instance (lazy import)."""
    from graph_engine import GraphEngine
    return GraphEngine()


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


def store_entry(entry_type: str, content: str, metadata: Optional[Dict] = None, no_graph: bool = False):
    """Store an entry in the database and optionally add a graph edge."""
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
    
    # Auto-add same_session edge if entry is part of a session
    if not no_graph:
        try:
            engine = get_graph_engine()
            engine.load()
            
            session_id = metadata.get("session_id")
            if session_id:
                engine.add_edge(session_id, entry_id, "same_session")
                engine.save()
                print(f"  Graph edge: {session_id} --same_session--> {entry_id}")
            
            # Also link to other entries of same type in last 60 minutes
            # (heuristic: likely same work session)
            elif entry_type != "session":
                # Find most recent session entry
                try:
                    session_coll = client.get_collection(name="session")
                    recent = session_coll.query(
                        query_texts=[content],
                        n_results=1,
                    )
                    if recent["ids"] and recent["ids"][0]:
                        session_node = recent["ids"][0][0]
                        engine.add_edge(session_node, entry_id, "same_session")
                        engine.save()
                        print(f"  Graph edge: {session_node} --same_session--> {entry_id}")
                except Exception:
                    pass  # Non-critical, don't fail the store
        except Exception as e:
            print(f"  Graph: skipped ({e})")
    
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


# ── Graph Commands ─────────────────────────────────────────────

def graph_add_edge(args):
    """Handle: memory graph add-edge --from X --to Y --type TYPE"""
    engine = get_graph_engine()
    engine.load()
    
    added = engine.add_edge(
        args.from_node,
        args.to_node,
        args.type,
        args.weight,
        parse_metadata(args.metadata),
    )
    
    if added:
        engine.save()
        print(f"Edge added: {args.from_node} --{args.type}--> {args.to_node}")
    else:
        print(f"Edge already exists: {args.from_node} --{args.type}--> {args.to_node}")


def graph_remove_edge(args):
    """Handle: memory graph remove-edge --from X --to Y [--type TYPE]"""
    engine = get_graph_engine()
    engine.load()
    
    removed = engine.remove_edge(args.from_node, args.to_node, args.type)
    
    if removed:
        engine.save()
        print(f"Edge removed: {args.from_node} --> {args.to_node}")
    else:
        print(f"Edge not found: {args.from_node} --> {args.to_node}")


def graph_query_path(args):
    """Handle: memory graph query-path --from X --to Y"""
    engine = get_graph_engine()
    engine.load()
    
    path = engine.shortest_path(args.from_node, args.to_node)
    
    if path:
        print(f"Path found ({len(path)} nodes):")
        for i, node in enumerate(path):
            prefix = "  " + "  " * i
            if i < len(path) - 1:
                # Show edge type
                edge_data = engine.graph[path[i]][path[i+1]]
                etype = edge_data.get("type", "?")
                print(f"{prefix}{node}")
                print(f"{prefix}  [{etype}]")
            else:
                print(f"{prefix}{node}")
    else:
        print(f"No path found: {args.from_node} -> {args.to_node}")


def graph_neighbors(args):
    """Handle: memory graph neighbors NODE"""
    engine = get_graph_engine()
    engine.load()
    
    direction = args.direction
    neighbors = engine.neighbors(args.node, direction)
    
    if not neighbors:
        print(f"No {direction} neighbors found for: {args.node}")
        return
    
    print(f"Neighbors of {args.node} ({direction}):")
    for neighbor in neighbors:
        # Show edge details
        if direction in ("out", "both") and engine.graph.has_edge(args.node, neighbor):
            data = engine.graph[args.node][neighbor]
            print(f"  --{data.get('type', '?')}--> {neighbor}")
        elif direction in ("in", "both") and engine.graph.has_edge(neighbor, args.node):
            data = engine.graph[neighbor][args.node]
            print(f"  <--{data.get('type', '?')}-- {neighbor}")
        else:
            print(f"  {neighbor}")


def graph_subgraph(args):
    """Handle: memory graph subgraph --tag TAG [--output FILE]"""
    engine = get_graph_engine()
    engine.load()
    
    sub = engine.subgraph(tag=args.tag)
    
    if sub.number_of_nodes() == 0:
        print(f"No nodes found with tag: {args.tag}")
        return
    
    print(f"Subgraph for tag '{args.tag}':")
    print(f"  Nodes: {sub.number_of_nodes()}")
    print(f"  Edges: {sub.number_of_edges()}")
    
    if args.output:
        # Export subgraph as JSON
        edges = []
        for u, v, data in sub.edges(data=True):
            edges.append({"from": u, "to": v, **data})
        
        output_data = {
            "tag": args.tag,
            "nodes": sub.number_of_nodes(),
            "edges": sub.number_of_edges(),
            "edges_list": edges,
        }
        Path(args.output).write_text(json.dumps(output_data, indent=2, ensure_ascii=False))
        print(f"  Exported to: {args.output}")


def graph_viz(args):
    """Handle: memory graph viz [--output FILE] [--format html|png|dot] [--filter-type T] [--focus N] [--open]"""
    engine = get_graph_engine()
    engine.load()

    if engine.graph.number_of_nodes() == 0:
        print("Graph is empty. Add edges first.")
        return

    fmt = args.format
    output = args.output or f"graph.{fmt}"

    # Parse filter types (comma-separated)
    filter_types = None
    if args.filter_type:
        filter_types = [t.strip() for t in args.filter_type.split(",")]

    if fmt == "html":
        path = engine.visualize_pyvis(
            output=output,
            limit=args.limit,
            filter_types=filter_types,
            focus_node=args.focus,
            focus_depth=args.focus_depth,
            enrich_chroma=not args.no_enrich,
        )
        if path:
            print(f"Interactive visualization: {path}")
            if args.open:
                import webbrowser
                webbrowser.open(f"file://{path}")
    elif fmt == "png":
        path = engine.visualize_matplotlib(
            output=output,
            limit=args.limit,
            filter_types=filter_types,
            focus_node=args.focus,
            focus_depth=args.focus_depth,
        )
        if path:
            print(f"Static visualization: {path}")
    elif fmt == "dot":
        path = engine.export_dot(output=output)
        if path:
            print(f"DOT file: {path}")
            print("Render with: dot -Tpng graph.dot -o graph.png")


def graph_serve(args):
    """Handle: memory graph serve [--port PORT] [--filter-type T] [--focus N]"""
    engine = get_graph_engine()
    engine.load()

    filter_types = None
    if args.filter_type:
        filter_types = [t.strip() for t in args.filter_type.split(",")]

    engine.visualize_server(
        host=args.host,
        port=args.port,
        filter_types=filter_types,
        focus_node=args.focus,
        focus_depth=args.focus_depth,
        auto_open=not args.no_open,
    )


def graph_export(args):
    """Handle: memory graph export [--output FILE] [--filter-type T] [--focus N]"""
    engine = get_graph_engine()
    engine.load()

    filter_types = None
    if args.filter_type:
        filter_types = [t.strip() for t in args.filter_type.split(",")]

    output = args.output or "graph-export.json"
    path = engine.export_json(
        output=output,
        filter_types=filter_types,
        focus_node=args.focus,
        focus_depth=args.focus_depth,
    )
    print(f"Exported graph data: {path}")


def graph_stats(args):
    """Handle: memory graph stats"""
    engine = get_graph_engine()
    engine.load()
    
    s = engine.stats()
    
    print("Graph Statistics:")
    print("=" * 40)
    print(f"  Nodes:                 {s['nodes']}")
    print(f"  Edges:                 {s['edges']}")
    print(f"  Density:               {s['density']}")
    print(f"  Isolated nodes:        {s['isolated_nodes']}")
    print(f"  Connected components:  {s['weakly_connected_components']}")
    print(f"  Largest component:     {s['largest_component_size']}")
    
    if s['edge_types']:
        print(f"\n  Edge types:")
        for etype, count in sorted(s['edge_types'].items(), key=lambda x: -x[1]):
            print(f"    {etype}: {count}")
    
    if s['top_connected_nodes']:
        print(f"\n  Most connected nodes:")
        for node, degree in s['top_connected_nodes'][:5]:
            print(f"    {node}: {degree} connections")


def graph_validate(args):
    """Handle: memory graph validate [--check-chroma]"""
    engine = get_graph_engine()
    engine.load()
    
    result = engine.validate(check_chroma=args.check_chroma)
    
    if result['valid']:
        print("Validation: PASS")
    else:
        print("Validation: FAIL")
    
    if result['issues']:
        print(f"\nIssues found: {len(result['issues'])}")
        for issue in result['issues']:
            severity = issue['severity'].upper()
            itype = issue['type']
            print(f"  [{severity}] {itype}")
            if 'count' in issue:
                print(f"    Count: {issue['count']}")
            if 'details' in issue:
                for d in issue['details'][:3]:
                    print(f"    - {d}")
    else:
        print("No issues found.")
    
    s = result['stats']
    print(f"\nGraph: {s['nodes']} nodes, {s['edges']} edges, {s['components']} components")


def graph_search(args):
    """Handle: memory graph search QUERY"""
    engine = get_graph_engine()
    engine.load()
    
    matches = engine.search_nodes(args.query)
    
    if not matches:
        print(f"No nodes matching: {args.query}")
        return
    
    print(f"Nodes matching '{args.query}' ({len(matches)}):")
    for node in matches[:20]:
        degree = engine.graph.degree(node)
        print(f"  {node} (degree: {degree})")


def graph_merge(args):
    """Handle: memory graph merge --input FILE"""
    engine = get_graph_engine()
    engine.load()
    
    added = engine.merge_from_json(Path(args.input))
    engine.save()
    
    print(f"Merged {added} new edges from {args.input}")


def main():
    parser = argparse.ArgumentParser(
        description="Memory CLI for ZCode ADE (with graph layer)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python memory_cli.py init
    python memory_cli.py store session "Working on React hooks refactoring"
    python memory_cli.py store knowledge "Use useCallback" --metadata category=react
    python memory_cli.py query "react hooks"
    python memory_cli.py list session
    python memory_cli.py delete session_20240101_120000

  Graph commands:
    python memory_cli.py graph add-edge --from session_1 --to task_1 --type same_session
    python memory_cli.py graph query-path --from session_1 --to fix_1
    python memory_cli.py graph neighbors task_1
    python memory_cli.py graph stats
    python memory_cli.py graph validate
    python memory_cli.py graph viz --format html --open
    python memory_cli.py graph viz --filter-type same_session,imports
    python memory_cli.py graph viz --focus session_20260518 --focus-depth 3
    python memory_cli.py graph serve --port 8765
    python memory_cli.py graph export --output graph-data.json
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # ── ChromaDB Commands ──
    
    # Init command
    subparsers.add_parser("init", help="Initialize database")
    
    # Store command
    store_parser = subparsers.add_parser("store", help="Store an entry")
    store_parser.add_argument("type", choices=ENTRY_TYPES, help="Entry type")
    store_parser.add_argument("content", help="Content to store")
    store_parser.add_argument("--metadata", "-m", help="JSON or key=value metadata")
    store_parser.add_argument("--no-graph", action="store_true", help="Skip auto graph edge creation")
    
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
    
    # ── Graph Commands ──
    
    graph_parser = subparsers.add_parser("graph", help="Graph operations (NetworkX)")
    graph_sub = graph_parser.add_subparsers(dest="graph_command", help="Graph subcommands")
    
    # graph add-edge
    add_edge_p = graph_sub.add_parser("add-edge", help="Add edge between nodes")
    add_edge_p.add_argument("--from", dest="from_node", required=True, help="Source node ID")
    add_edge_p.add_argument("--to", dest="to_node", required=True, help="Target node ID")
    add_edge_p.add_argument("--type", dest="type", default="related_to", help="Edge type")
    add_edge_p.add_argument("--weight", type=float, default=1.0, help="Edge weight (0.0-1.0)")
    add_edge_p.add_argument("--metadata", "-m", help="JSON metadata for edge")
    
    # graph remove-edge
    remove_edge_p = graph_sub.add_parser("remove-edge", help="Remove edge between nodes")
    remove_edge_p.add_argument("--from", dest="from_node", required=True, help="Source node ID")
    remove_edge_p.add_argument("--to", dest="to_node", required=True, help="Target node ID")
    remove_edge_p.add_argument("--type", dest="type", default=None, help="Only remove if type matches")
    
    # graph query-path
    query_path_p = graph_sub.add_parser("query-path", help="Find shortest path between nodes")
    query_path_p.add_argument("--from", dest="from_node", required=True, help="Start node")
    query_path_p.add_argument("--to", dest="to_node", required=True, help="End node")
    
    # graph neighbors
    neighbors_p = graph_sub.add_parser("neighbors", help="Show connected nodes")
    neighbors_p.add_argument("node", help="Node ID")
    neighbors_p.add_argument("--direction", "-d", choices=["in", "out", "both"], default="both", help="Edge direction")
    
    # graph subgraph
    subgraph_p = graph_sub.add_parser("subgraph", help="Extract subgraph by tag")
    subgraph_p.add_argument("--tag", required=True, help="Tag to filter by")
    subgraph_p.add_argument("--output", "-o", help="Export subgraph to JSON file")
    
    # graph viz
    viz_p = graph_sub.add_parser("viz", help="Visualize graph")
    viz_p.add_argument("--output", "-o", help="Output file path")
    viz_p.add_argument("--format", "-f", choices=["html", "png", "dot"], default="html", help="Output format")
    viz_p.add_argument("--limit", type=int, default=500, help="Max nodes to visualize")
    viz_p.add_argument("--filter-type", "-t", help="Only show these edge types (comma-separated, e.g. same_session,imports)")
    viz_p.add_argument("--focus", help="Focus on this node (show its neighborhood)")
    viz_p.add_argument("--focus-depth", type=int, default=2, help="Hops from focus node (default: 2)")
    viz_p.add_argument("--open", action="store_true", help="Auto-open in browser")
    viz_p.add_argument("--no-enrich", action="store_true", help="Skip ChromaDB metadata enrichment")

    # graph serve
    serve_p = graph_sub.add_parser("serve", help="Start local viz server with auto-refresh")
    serve_p.add_argument("--host", default="localhost", help="Host to bind (default: localhost)")
    serve_p.add_argument("--port", "-p", type=int, default=8765, help="Port (default: 8765)")
    serve_p.add_argument("--filter-type", "-t", help="Only show these edge types (comma-separated)")
    serve_p.add_argument("--focus", help="Focus on this node")
    serve_p.add_argument("--focus-depth", type=int, default=2, help="Hops from focus node")
    serve_p.add_argument("--no-open", action="store_true", help="Don't auto-open browser")

    # graph export
    export_p = graph_sub.add_parser("export", help="Export graph data as JSON (for dashboard/API)")
    export_p.add_argument("--output", "-o", help="Output file path (default: graph-export.json)")
    export_p.add_argument("--filter-type", "-t", help="Only include these edge types (comma-separated)")
    export_p.add_argument("--focus", help="Focus on this node")
    export_p.add_argument("--focus-depth", type=int, default=2, help="Hops from focus node")
    
    # graph stats
    graph_sub.add_parser("stats", help="Graph statistics")
    
    # graph validate
    validate_p = graph_sub.add_parser("validate", help="Validate graph integrity")
    validate_p.add_argument("--check-chroma", action="store_true", help="Also check ChromaDB node existence")
    
    # graph search
    search_p = graph_sub.add_parser("search", help="Search nodes by substring")
    search_p.add_argument("query", help="Search string")
    
    # graph merge
    merge_p = graph_sub.add_parser("merge", help="Merge edges from another graph.json")
    merge_p.add_argument("--input", "-i", required=True, help="Path to graph.json to merge")
    
    # ── Parse & Dispatch ──
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == "init":
        init_db()
    elif args.command == "store":
        metadata = parse_metadata(args.metadata)
        store_entry(args.type, args.content, metadata, no_graph=args.no_graph)
    elif args.command == "query":
        query_entries(args.query, args.type, args.limit)
    elif args.command == "list":
        list_entries(args.type, args.limit)
    elif args.command == "delete":
        delete_entry(args.id, args.type)
    elif args.command == "export":
        export_entries(args.type, args.output)
    elif args.command == "graph":
        if not args.graph_command:
            graph_parser.print_help()
            sys.exit(1)
        
        dispatch = {
            "add-edge": graph_add_edge,
            "remove-edge": graph_remove_edge,
            "query-path": graph_query_path,
            "neighbors": graph_neighbors,
            "subgraph": graph_subgraph,
            "viz": graph_viz,
            "serve": graph_serve,
            "export": graph_export,
            "stats": graph_stats,
            "validate": graph_validate,
            "search": graph_search,
            "merge": graph_merge,
        }
        
        handler = dispatch.get(args.graph_command)
        if handler:
            handler(args)
        else:
            graph_parser.print_help()


if __name__ == "__main__":
    main()
