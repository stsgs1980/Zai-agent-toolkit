#!/usr/bin/env python3
"""
Graph Engine for ZCode Memory System.

Provides a graph layer on top of ChromaDB using NetworkX.
Edges are stored in graph.json and loaded into a DiGraph for traversal.

Usage:
    from graph_engine import GraphEngine

    engine = GraphEngine()
    engine.add_edge("session_1", "task_1", "same_session")
    engine.add_edge("task_1", "fix_1", "fixed_by")
    path = engine.shortest_path("session_1", "fix_1")
    engine.visualize(output="graph.html")
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple, Set

try:
    import networkx as nx
except ImportError:
    print("ERROR: networkx not installed")
    print("Run: pip install networkx")
    sys.exit(1)

# Default paths
DEFAULT_MEMORY_PATH = Path.home() / ".zcode" / "memory"
DEFAULT_GRAPH_PATH = DEFAULT_MEMORY_PATH / "graph.json"

# Valid edge types with descriptions
EDGE_TYPES = {
    "parent_dir": "File is in directory",
    "imports": "Code dependency (importer -> imported)",
    "same_session": "Created in same session",
    "depends_on": "Task dependency",
    "follow_up": "Sequential relation (earlier -> later)",
    "fixed_by": "Bug fix chain (bug -> fix)",
    "implements": "Implementation link (code -> requirement)",
    "modifies": "Commit changes file",
    "related_to": "Generic bidirectional relation",
}

GRAPH_VERSION = 1


class GraphEngine:
    """NetworkX-based graph engine for memory relationships."""

    def __init__(self, graph_path: Optional[Path] = None, chroma_path: Optional[Path] = None):
        """Initialize graph engine.

        Args:
            graph_path: Path to graph.json file. Defaults to ~/.zcode/memory/graph.json
            chroma_path: Path to ChromaDB for validation. Defaults to ~/.zcode/memory/chromadb
        """
        self.graph_path = Path(graph_path) if graph_path else DEFAULT_GRAPH_PATH
        self.chroma_path = Path(chroma_path) if chroma_path else (self.graph_path.parent / "chromadb")
        self.graph: nx.DiGraph = nx.DiGraph()
        self._loaded = False

    # ── Load / Save ────────────────────────────────────────────────

    def load(self) -> bool:
        """Load graph from graph.json. Returns True if file existed."""
        if not self.graph_path.exists():
            self._loaded = True
            return False

        try:
            with open(self.graph_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"ERROR: Failed to load graph.json: {e}")
            return False

        self.graph.clear()

        version = data.get("version", 0)
        if version != GRAPH_VERSION:
            print(f"WARNING: graph.json version {version}, expected {GRAPH_VERSION}")

        for edge in data.get("edges", []):
            self.graph.add_edge(
                edge["from"],
                edge["to"],
                type=edge.get("type", "related_to"),
                weight=edge.get("weight", 1.0),
                metadata=edge.get("metadata", {}),
            )

        # Add isolated nodes if present
        for node in data.get("isolated_nodes", []):
            if not self.graph.has_node(node):
                self.graph.add_node(node)

        self._loaded = True
        return True

    def save(self) -> None:
        """Save graph to graph.json."""
        self.graph_path.parent.mkdir(parents=True, exist_ok=True)

        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "from": u,
                "to": v,
                "type": data.get("type", "related_to"),
                "weight": data.get("weight", 1.0),
                "metadata": data.get("metadata", {}),
            })

        # Find isolated nodes (no edges)
        isolated = list(nx.isolates(self.graph))

        data = {
            "version": GRAPH_VERSION,
            "created_at": datetime.now().isoformat(),
            "stats": {
                "nodes": self.graph.number_of_nodes(),
                "edges": self.graph.number_of_edges(),
                "isolated": len(isolated),
            },
            "edges": edges,
            "isolated_nodes": isolated,
        }

        # Atomic write: write to temp, then rename
        temp_path = self.graph_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        temp_path.replace(self.graph_path)

    def ensure_loaded(self) -> None:
        """Load graph if not already loaded."""
        if not self._loaded:
            self.load()

    # ── Edge CRUD ──────────────────────────────────────────────────

    def add_edge(
        self,
        from_node: str,
        to_node: str,
        edge_type: str = "related_to",
        weight: float = 1.0,
        metadata: Optional[Dict] = None,
    ) -> bool:
        """Add an edge to the graph.

        Args:
            from_node: Source node ID
            to_node: Target node ID
            edge_type: One of EDGE_TYPES keys
            weight: Edge weight (0.0 - 1.0)
            metadata: Optional metadata dict

        Returns:
            True if edge was added, False if it already exists
        """
        self.ensure_loaded()

        if edge_type not in EDGE_TYPES:
            print(f"WARNING: Unknown edge type '{edge_type}'. Valid: {list(EDGE_TYPES.keys())}")
            print(f"  Using 'related_to' instead.")
            edge_type = "related_to"

        # Check if edge already exists
        if self.graph.has_edge(from_node, to_node):
            existing = self.graph[from_node][to_node]
            if existing.get("type") == edge_type:
                return False  # Duplicate edge

        self.graph.add_edge(
            from_node,
            to_node,
            type=edge_type,
            weight=weight,
            metadata=metadata or {},
        )
        return True

    def remove_edge(self, from_node: str, to_node: str, edge_type: Optional[str] = None) -> bool:
        """Remove an edge. If edge_type is given, only remove if type matches.

        Returns:
            True if edge was removed, False if not found
        """
        self.ensure_loaded()

        if not self.graph.has_edge(from_node, to_node):
            return False

        if edge_type:
            existing_type = self.graph[from_node][to_node].get("type")
            if existing_type != edge_type:
                return False

        self.graph.remove_edge(from_node, to_node)
        return True

    def get_edges(self, node: Optional[str] = None, edge_type: Optional[str] = None) -> List[Dict]:
        """Get edges, optionally filtered by node or type.

        Args:
            node: Filter to edges involving this node
            edge_type: Filter to this edge type

        Returns:
            List of edge dicts with from, to, type, weight, metadata
        """
        self.ensure_loaded()

        result = []
        for u, v, data in self.graph.edges(data=True):
            if node and u != node and v != node:
                continue
            if edge_type and data.get("type") != edge_type:
                continue
            result.append({"from": u, "to": v, **data})

        return result

    # ── Traversal ──────────────────────────────────────────────────

    def shortest_path(self, from_node: str, to_node: str) -> Optional[List[str]]:
        """Find shortest path between two nodes.

        Returns:
            List of node IDs forming the path, or None if no path exists
        """
        self.ensure_loaded()

        try:
            return nx.shortest_path(self.graph, from_node, to_node)
        except nx.NetworkXNoPath:
            return None
        except nx.NodeNotFound:
            return None

    def all_shortest_paths(self, from_node: str, to_node: str) -> Optional[List[List[str]]]:
        """Find all shortest paths between two nodes.

        Returns:
            List of paths (each path is a list of node IDs), or None
        """
        self.ensure_loaded()

        try:
            return list(nx.all_shortest_paths(self.graph, from_node, to_node))
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    def neighbors(self, node: str, direction: str = "both") -> List[str]:
        """Get neighbors of a node.

        Args:
            node: Node ID
            direction: "out" (successors), "in" (predecessors), "both" (all)

        Returns:
            List of neighbor node IDs
        """
        self.ensure_loaded()

        if not self.graph.has_node(node):
            return []

        if direction == "out":
            return list(self.graph.successors(node))
        elif direction == "in":
            return list(self.graph.predecessors(node))
        else:  # both
            return list(set(self.graph.successors(node)) | set(self.graph.predecessors(node)))

    def neighbors_by_type(self, node: str, edge_type: str, direction: str = "out") -> List[Tuple[str, Dict]]:
        """Get neighbors connected by a specific edge type.

        Args:
            node: Node ID
            edge_type: Filter by this edge type
            direction: "out", "in", or "both"

        Returns:
            List of (neighbor_id, edge_data) tuples
        """
        self.ensure_loaded()

        result = []

        if direction in ("out", "both"):
            for successor in self.graph.successors(node):
                data = self.graph[node][successor]
                if data.get("type") == edge_type:
                    result.append((successor, data))

        if direction in ("in", "both"):
            for predecessor in self.graph.predecessors(node):
                data = self.graph[predecessor][node]
                if data.get("type") == edge_type:
                    result.append((predecessor, data))

        return result

    def subgraph(self, nodes: Optional[List[str]] = None, tag: Optional[str] = None) -> nx.DiGraph:
        """Extract a subgraph.

        Args:
            nodes: List of node IDs to include
            tag: Filter to nodes with this tag in metadata

        Returns:
            NetworkX DiGraph subgraph
        """
        self.ensure_loaded()

        if tag:
            tagged_nodes = []
            for node, data in self.graph.nodes(data=True):
                node_meta = data.get("metadata", {})
                if node_meta.get("tag") == tag or tag in str(node_meta.get("tags", [])):
                    tagged_nodes.append(node)
            nodes = tagged_nodes

        if nodes:
            valid_nodes = [n for n in nodes if self.graph.has_node(n)]
            return self.graph.subgraph(valid_nodes).copy()

        return self.graph.copy()

    def connected_component(self, node: str) -> Set[str]:
        """Get all nodes in the same weakly connected component as node.

        Returns:
            Set of node IDs in the component, or empty set if node not found
        """
        self.ensure_loaded()

        if not self.graph.has_node(node):
            return set()

        # Use undirected view for connectivity
        undirected = self.graph.to_undirected()
        component = nx.node_connected_component(undirected, node)
        return component

    def ancestors(self, node: str) -> Set[str]:
        """Get all ancestors (nodes that can reach this node).

        Returns:
            Set of ancestor node IDs
        """
        self.ensure_loaded()

        try:
            return nx.ancestors(self.graph, node)
        except nx.NetworkXError:
            return set()

    def descendants(self, node: str) -> Set[str]:
        """Get all descendants (nodes reachable from this node).

        Returns:
            Set of descendant node IDs
        """
        self.ensure_loaded()

        try:
            return nx.descendants(self.graph, node)
        except nx.NetworkXError:
            return set()

    # ── Validation ─────────────────────────────────────────────────

    def validate(self, check_chroma: bool = False) -> Dict:
        """Validate graph integrity.

        Args:
            check_chroma: If True, verify that edge endpoints exist in ChromaDB

        Returns:
            Dict with validation results
        """
        self.ensure_loaded()

        issues = []

        # 1. Check for self-loops
        self_loops = list(nx.selfloop_edges(self.graph))
        if self_loops:
            issues.append({
                "type": "self_loop",
                "severity": "warning",
                "count": len(self_loops),
                "details": [f"{u} -> {u}" for u, _ in self_loops[:5]],
            })

        # 2. Check for duplicate edges (same from/to but different types)
        edge_pairs = {}
        for u, v, data in self.graph.edges(data=True):
            key = (u, v)
            if key in edge_pairs:
                issues.append({
                    "type": "duplicate_edge",
                    "severity": "info",
                    "from": u,
                    "to": v,
                    "types": [edge_pairs[key], data.get("type")],
                })
            else:
                edge_pairs[key] = data.get("type")

        # 3. Check for unknown edge types
        unknown_types = set()
        for u, v, data in self.graph.edges(data=True):
            etype = data.get("type", "related_to")
            if etype not in EDGE_TYPES:
                unknown_types.add(etype)
        if unknown_types:
            issues.append({
                "type": "unknown_edge_type",
                "severity": "warning",
                "types": list(unknown_types),
            })

        # 4. Check for invalid weights
        bad_weights = []
        for u, v, data in self.graph.edges(data=True):
            w = data.get("weight", 1.0)
            if not isinstance(w, (int, float)) or w < 0 or w > 1:
                bad_weights.append(f"{u} -> {v} (weight={w})")
        if bad_weights:
            issues.append({
                "type": "invalid_weight",
                "severity": "warning",
                "count": len(bad_weights),
                "details": bad_weights[:5],
            })

        # 5. Check ChromaDB node existence (optional, slow)
        orphan_edges = []
        if check_chroma:
            chroma_nodes = self._get_chroma_node_ids()
            if chroma_nodes is not None:  # None means ChromaDB not available
                for u, v in self.graph.edges():
                    if u not in chroma_nodes and v not in chroma_nodes:
                        orphan_edges.append(f"{u} -> {v}")
                if orphan_edges:
                    issues.append({
                        "type": "orphan_edge",
                        "severity": "critical",
                        "count": len(orphan_edges),
                        "details": orphan_edges[:5],
                        "message": "Both endpoints not found in ChromaDB",
                    })

        return {
            "valid": not any(i["severity"] == "critical" for i in issues),
            "issues": issues,
            "stats": {
                "nodes": self.graph.number_of_nodes(),
                "edges": self.graph.number_of_edges(),
                "isolated": len(list(nx.isolates(self.graph))),
                "components": nx.number_weakly_connected_components(self.graph),
            },
        }

    def _get_chroma_node_ids(self) -> Optional[Set[str]]:
        """Get all node IDs from ChromaDB collections.

        Returns:
            Set of IDs, or None if ChromaDB is not available
        """
        try:
            import chromadb
        except ImportError:
            return None

        if not self.chroma_path.exists():
            return None

        try:
            client = chromadb.PersistentClient(path=str(self.chroma_path))
            all_ids = set()
            for collection_info in client.list_collections():
                try:
                    collection = client.get_collection(name=collection_info.name)
                    result = collection.get(include=[])
                    all_ids.update(result["ids"])
                except Exception:
                    continue
            return all_ids
        except Exception:
            return None

    # ── Statistics ─────────────────────────────────────────────────

    def stats(self) -> Dict:
        """Get graph statistics.

        Returns:
            Dict with comprehensive graph stats
        """
        self.ensure_loaded()

        n_nodes = self.graph.number_of_nodes()
        n_edges = self.graph.number_of_edges()

        # Edge type distribution
        type_counts = {}
        for u, v, data in self.graph.edges(data=True):
            etype = data.get("type", "related_to")
            type_counts[etype] = type_counts.get(etype, 0) + 1

        # Most connected nodes (by total degree)
        degree_ranking = sorted(
            self.graph.degree(),
            key=lambda x: x[1],
            reverse=True,
        )[:10]

        # Connected components
        n_components = nx.number_weakly_connected_components(self.graph)
        largest_component = 0
        if n_nodes > 0:
            components = nx.weakly_connected_components(self.graph)
            largest_component = max(len(c) for c in components)

        # Density
        density = nx.density(self.graph) if n_nodes > 1 else 0.0

        return {
            "nodes": n_nodes,
            "edges": n_edges,
            "density": round(density, 4),
            "isolated_nodes": len(list(nx.isolates(self.graph))),
            "weakly_connected_components": n_components,
            "largest_component_size": largest_component,
            "edge_types": type_counts,
            "top_connected_nodes": [(node, deg) for node, deg in degree_ranking],
        }

    # ── Visualization ──────────────────────────────────────────────

    # Color maps
    TYPE_COLORS = {
        "parent_dir": "#95a5a6",
        "imports": "#8e44ad",
        "same_session": "#2980b9",
        "depends_on": "#16a085",
        "follow_up": "#27ae60",
        "fixed_by": "#c0392b",
        "implements": "#f39c12",
        "modifies": "#e67e22",
        "related_to": "#3498db",
    }

    # Node group colors (by prefix pattern)
    NODE_GROUPS = {
        "session": {"color": "#2980b9", "shape": "diamond", "size": 25},
        "task": {"color": "#27ae60", "shape": "square", "size": 20},
        "bug": {"color": "#c0392b", "shape": "triangle", "size": 20},
        "knowledge": {"color": "#8e44ad", "shape": "dot", "size": 18},
        "commit": {"color": "#e67e22", "shape": "star", "size": 22},
        "src": {"color": "#16a085", "shape": "dot", "size": 14},
        "REQ": {"color": "#f39c12", "shape": "box", "size": 18},
    }

    def _classify_node(self, node_id: str) -> str:
        """Classify a node into a group based on its ID prefix."""
        lower = node_id.lower()
        for prefix in self.NODE_GROUPS:
            if lower.startswith(prefix):
                return prefix
        # Check for file-like nodes
        if "/" in node_id or "\\" in node_id or "." in node_id.split("_")[-1] if "_" in node_id else False:
            return "src"
        return "default"

    def _get_chroma_metadata(self, node_ids: List[str]) -> Dict[str, Dict]:
        """Fetch metadata from ChromaDB for given node IDs.

        Returns:
            Dict mapping node_id -> {content_preview, metadata}
        """
        try:
            import chromadb
        except ImportError:
            return {}

        if not self.chroma_path.exists():
            return {}

        try:
            client = chromadb.PersistentClient(path=str(self.chroma_path))
            result = {}
            for collection_info in client.list_collections():
                try:
                    collection = client.get_collection(name=collection_info.name)
                    # ChromaDB get() with specific IDs
                    found = collection.get(ids=node_ids, include=["documents", "metadatas"])
                    for i, nid in enumerate(found["ids"]):
                        doc = found["documents"][i] if found["documents"] else ""
                        meta = found["metadatas"][i] if found["metadatas"] else {}
                        result[nid] = {
                            "content_preview": (doc[:120] + "...") if doc and len(doc) > 120 else (doc or ""),
                            "metadata": meta,
                            "collection": collection_info.name,
                        }
                except Exception:
                    continue
            return result
        except Exception:
            return {}

    def _filter_subgraph(
        self,
        filter_types: Optional[List[str]] = None,
        focus_node: Optional[str] = None,
        focus_depth: int = 2,
        limit: int = 500,
    ) -> nx.DiGraph:
        """Build a filtered subgraph for visualization.

        Args:
            filter_types: Only include edges of these types
            focus_node: Center on this node, include neighbors up to focus_depth hops
            focus_depth: How many hops from focus_node to include
            limit: Max nodes in result

        Returns:
            Filtered NetworkX DiGraph
        """
        self.ensure_loaded()

        if self.graph.number_of_nodes() == 0:
            return self.graph.copy()

        # Step 1: Filter by edge types
        if filter_types:
            edges_to_keep = [
                (u, v) for u, v, d in self.graph.edges(data=True)
                if d.get("type") in filter_types
            ]
            nodes_in_edges = set()
            for u, v in edges_to_keep:
                nodes_in_edges.add(u)
                nodes_in_edges.add(v)
            sub = self.graph.subgraph(nodes_in_edges).copy()
            # Re-add only filtered edges
            sub_filtered = nx.DiGraph()
            sub_filtered.add_nodes_from(sub.nodes(data=True))
            for u, v in edges_to_keep:
                if sub.has_node(u) and sub.has_node(v):
                    sub_filtered.add_edge(u, v, **sub[u][v])
            sub = sub_filtered
        else:
            sub = self.graph.copy()

        # Step 2: Focus on a specific node (ego graph)
        if focus_node:
            if not self.graph.has_node(focus_node):
                print(f"WARNING: Focus node '{focus_node}' not found in graph")
            else:
                # Build ego graph: all nodes within focus_depth hops
                undirected = self.graph.to_undirected()
                try:
                    ego_nodes = set()
                    current_frontier = {focus_node}
                    visited = {focus_node}
                    for _ in range(focus_depth):
                        next_frontier = set()
                        for n in current_frontier:
                            for neighbor in undirected.neighbors(n):
                                if neighbor not in visited:
                                    next_frontier.add(neighbor)
                                    visited.add(neighbor)
                        ego_nodes.update(current_frontier)
                        current_frontier = next_frontier
                    ego_nodes.update(current_frontier)
                    # Intersect with type-filtered subgraph
                    if filter_types:
                        ego_nodes = ego_nodes & set(sub.nodes())
                    sub = self.graph.subgraph(list(ego_nodes)[:limit]).copy()
                    # Re-apply type filter on focused subgraph
                    if filter_types:
                        edges_to_keep = [
                            (u, v) for u, v, d in sub.edges(data=True)
                            if d.get("type") in filter_types
                        ]
                        sub_f = nx.DiGraph()
                        sub_f.add_nodes_from(sub.nodes(data=True))
                        for u, v in edges_to_keep:
                            sub_f.add_edge(u, v, **sub[u][v])
                        sub = sub_f
                except nx.NetworkXError:
                    pass

        # Step 3: Limit size
        if sub.number_of_nodes() > limit:
            components = nx.weakly_connected_components(sub)
            largest = max(components, key=len)
            sub = sub.subgraph(list(largest)[:limit]).copy()

        return sub

    def visualize_pyvis(
        self,
        output: str = "graph.html",
        limit: int = 500,
        filter_types: Optional[List[str]] = None,
        focus_node: Optional[str] = None,
        focus_depth: int = 2,
        enrich_chroma: bool = True,
    ) -> str:
        """Generate interactive HTML visualization using pyvis.

        Args:
            output: Output HTML file path
            limit: Max nodes to visualize (for performance)
            filter_types: Only show edges of these types (e.g. ["same_session", "imports"])
            focus_node: Center visualization on this node
            focus_depth: Hops from focus_node to include
            enrich_chroma: If True, enrich node tooltips with ChromaDB data

        Returns:
            Path to generated HTML file
        """
        self.ensure_loaded()

        try:
            from pyvis.network import Network
        except ImportError:
            print("ERROR: pyvis not installed")
            print("Run: pip install pyvis")
            return ""

        sub = self._filter_subgraph(
            filter_types=filter_types,
            focus_node=focus_node,
            focus_depth=focus_depth,
            limit=limit,
        )

        if sub.number_of_nodes() == 0:
            print("Graph is empty or filtered result is empty, nothing to visualize")
            return ""

        # Enrich with ChromaDB metadata
        chroma_data = {}
        if enrich_chroma:
            node_ids = list(sub.nodes())
            chroma_data = self._get_chroma_metadata(node_ids)

        net = Network(
            height="900px",
            width="100%",
            directed=True,
            notebook=False,
            bgcolor="#1a1a2e",
            font_color="#e0e0e0",
        )

        net.barnes_hut(
            gravity=-5000,
            central_gravity=0.3,
            spring_length=150,
            spring_strength=0.001,
            damping=0.09,
        )

        # Add nodes with group-based styling
        for node, data in sub.nodes(data=True):
            group = self._classify_node(node)
            group_info = self.NODE_GROUPS.get(group, {"color": "#4a90d9", "shape": "dot", "size": 15})

            label = node if len(node) <= 35 else node[:32] + "..."

            # Build rich tooltip from ChromaDB
            tooltip_parts = [f"<b>{node}</b>"]
            tooltip_parts.append(f"Group: {group}")
            tooltip_parts.append(f"Degree: {sub.degree(node)}")

            if node in chroma_data:
                cd = chroma_data[node]
                tooltip_parts.append(f"Collection: {cd.get('collection', '?')}")
                if cd.get("content_preview"):
                    tooltip_parts.append(f"Content: {cd['content_preview']}")
                meta = cd.get("metadata", {})
                if meta.get("created_at"):
                    tooltip_parts.append(f"Created: {meta['created_at']}")
                if meta.get("type"):
                    tooltip_parts.append(f"Type: {meta['type']}")

            tooltip = "<br>".join(tooltip_parts)

            net.add_node(
                node,
                label=label,
                title=tooltip,
                color=group_info["color"],
                size=group_info["size"],
                shape=group_info["shape"],
                group=group,
            )

        # Add edges
        for u, v, data in sub.edges(data=True):
            etype = data.get("type", "related_to")
            color = self.TYPE_COLORS.get(etype, "#3498db")
            weight = data.get("weight", 1.0)
            edge_tooltip = f"{etype} (weight: {weight})"
            meta = data.get("metadata", {})
            if meta:
                edge_tooltip += f"\n{json.dumps(meta, ensure_ascii=False)}"
            net.add_edge(u, v, color=color, title=edge_tooltip, width=1 + weight * 2, label=etype if len(sub.edges) < 50 else "")

        # Add legend + stats panel
        used_types = {d.get("type", "related_to") for _, _, d in sub.edges(data=True)}
        legend_items = "".join(
            f'<span style="color:{self.TYPE_COLORS.get(t, "#3498db")}">&#9679;</span> {t} &nbsp; '
            for t in sorted(used_types)
        )

        # Node group legend
        used_groups = {self._classify_node(n) for n in sub.nodes()}
        group_legend = "".join(
            f'<span style="color:{self.NODE_GROUPS.get(g, {}).get("color", "#4a90d9")}">&#9632;</span> {g} &nbsp; '
            for g in sorted(used_groups)
        )

        stats_html = f"""
        <div style='padding:10px;color:#e0e0e0;font-family:monospace;font-size:12px;
                    background:#16213e;border-top:1px solid #2a3a5e'>
          <b>Graph Visualization</b> | Nodes: {sub.number_of_nodes()} | Edges: {sub.number_of_edges()}
          <br>Edge types: {legend_items}
          <br>Node groups: {group_legend}
          <br>Filter: {", ".join(filter_types) if filter_types else "all"} | Focus: {focus_node or "none"} (depth={focus_depth})
        </div>
        """
        net.html = net.html.replace("</body>", stats_html + "</body>")

        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        net.save_graph(str(output_path))
        return str(output_path)

    def visualize_matplotlib(
        self,
        output: str = "graph.png",
        limit: int = 200,
        filter_types: Optional[List[str]] = None,
        focus_node: Optional[str] = None,
        focus_depth: int = 2,
    ) -> str:
        """Generate static PNG visualization using matplotlib.

        Args:
            output: Output PNG file path
            limit: Max nodes to visualize
            filter_types: Only show edges of these types
            focus_node: Center on this node
            focus_depth: Hops from focus_node

        Returns:
            Path to generated PNG file
        """
        self.ensure_loaded()

        try:
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt
        except ImportError:
            print("ERROR: matplotlib not installed")
            print("Run: pip install matplotlib")
            return ""

        sub = self._filter_subgraph(
            filter_types=filter_types,
            focus_node=focus_node,
            focus_depth=focus_depth,
            limit=limit,
        )

        if sub.number_of_nodes() == 0:
            print("Graph is empty or filtered result is empty, nothing to visualize")
            return ""

        fig, ax = plt.subplots(1, 1, figsize=(16, 12))
        pos = nx.spring_layout(sub, k=2, iterations=50)

        # Color nodes by group
        node_colors = []
        for node in sub.nodes():
            group = self._classify_node(node)
            group_info = self.NODE_GROUPS.get(group, {"color": "#4a90d9"})
            node_colors.append(group_info["color"])

        # Draw nodes
        nx.draw_networkx_nodes(sub, pos, node_size=200, node_color=node_colors, alpha=0.8, ax=ax)

        # Draw edges by type
        for etype in set(d.get("type", "related_to") for _, _, d in sub.edges(data=True)):
            edge_list = [(u, v) for u, v, d in sub.edges(data=True) if d.get("type") == etype]
            color = self.TYPE_COLORS.get(etype, "#3498db")
            nx.draw_networkx_edges(sub, pos, edgelist=edge_list, edge_color=color, alpha=0.6, arrows=True, ax=ax)

        # Labels (truncated)
        labels = {n: n[:20] + "..." if len(n) > 20 else n for n in sub.nodes()}
        nx.draw_networkx_labels(sub, pos, labels, font_size=7, ax=ax)

        title_parts = [f"Memory Graph ({sub.number_of_nodes()} nodes, {sub.number_of_edges()} edges)"]
        if filter_types:
            title_parts.append(f"Filter: {', '.join(filter_types)}")
        if focus_node:
            title_parts.append(f"Focus: {focus_node}")
        ax.set_title(" | ".join(title_parts))
        ax.axis("off")

        # Legend
        from matplotlib.patches import Patch
        used_types = set(d.get("type", "related_to") for _, _, d in sub.edges(data=True))
        legend_elements = [
            Patch(facecolor=self.TYPE_COLORS[t], label=t) for t in used_types if t in self.TYPE_COLORS
        ]
        if legend_elements:
            ax.legend(handles=legend_elements, loc="best", fontsize=8)

        plt.tight_layout()
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        plt.close()
        return str(output_path)

    def visualize_server(
        self,
        host: str = "localhost",
        port: int = 8765,
        filter_types: Optional[List[str]] = None,
        focus_node: Optional[str] = None,
        focus_depth: int = 2,
        auto_open: bool = True,
    ) -> None:
        """Start a local HTTP server serving interactive graph visualization.

        Generates the HTML visualization and serves it on a local port.
        The visualization auto-refreshes when graph.json changes.

        Args:
            host: Host to bind to
            port: Port number
            filter_types: Only show edges of these types
            focus_node: Center on this node
            focus_depth: Hops from focus_node
            auto_open: If True, open browser automatically
        """
        import http.server
        import threading
        import webbrowser

        # Generate visualization to memory dir
        output_dir = self.graph_path.parent / "viz"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / "graph.html"

        self.visualize_pyvis(
            output=str(output_file),
            filter_types=filter_types,
            focus_node=focus_node,
            focus_depth=focus_depth,
        )

        if not output_file.exists():
            print("ERROR: Failed to generate visualization")
            return

        # Inject auto-refresh script into HTML
        html = output_file.read_text(encoding="utf-8")
        refresh_script = """
        <script>
        // Auto-refresh every 5 seconds if graph.json changes
        let lastCheck = Date.now();
        setInterval(() => {
            fetch('/api/reload?t=' + Date.now())
                .then(r => r.json())
                .then(data => {
                    if (data.reload) location.reload();
                })
                .catch(() => {});
        }, 5000);
        </script>
        """
        html = html.replace("</head>", refresh_script + "\n</head>")
        output_file.write_text(html, encoding="utf-8")

        # Custom handler with /api/reload endpoint
        class VizHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(output_dir), **kwargs)

            def do_GET(self):
                if self.path.startswith("/api/reload"):
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    # Check if graph.json was modified
                    try:
                        mtime = engine.graph_path.stat().st_mtime
                        reload = mtime > last_check_time[0]
                        if reload:
                            last_check_time[0] = mtime
                        self.wfile.write(json.dumps({"reload": reload}).encode())
                    except Exception:
                        self.wfile.write(json.dumps({"reload": False}).encode())
                else:
                    super().do_GET()

            def log_message(self, format, *args):
                # Suppress verbose logging
                pass

        last_check_time = [self.graph_path.stat().st_mtime if self.graph_path.exists() else 0]
        engine = self

        server = http.server.HTTPServer((host, port), VizHandler)
        url = f"http://{host}:{port}/graph.html"

        print(f"Graph visualization server running at: {url}")
        print(f"Press Ctrl+C to stop")

        if auto_open:
            threading.Timer(1.0, lambda: webbrowser.open(url)).start()

        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            server.server_close()

    def export_json(
        self,
        output: str = "graph-export.json",
        filter_types: Optional[List[str]] = None,
        focus_node: Optional[str] = None,
        focus_depth: int = 2,
    ) -> str:
        """Export graph data as JSON (for dashboard/API consumption).

        Args:
            output: Output JSON file path
            filter_types: Only include edges of these types
            focus_node: Only include nodes in this node's neighborhood
            focus_depth: Hops from focus_node

        Returns:
            Path to exported JSON file
        """
        sub = self._filter_subgraph(
            filter_types=filter_types,
            focus_node=focus_node,
            focus_depth=focus_depth,
        )

        # Build node list with metadata
        nodes = []
        for node, data in sub.nodes(data=True):
            node_info = {
                "id": node,
                "group": self._classify_node(node),
                "degree": sub.degree(node),
                "in_degree": sub.in_degree(node),
                "out_degree": sub.out_degree(node),
            }
            node_info.update(data)
            nodes.append(node_info)

        # Build edge list
        edges = []
        for u, v, data in sub.edges(data=True):
            edges.append({"from": u, "to": v, **data})

        export_data = {
            "exported_at": datetime.now().isoformat(),
            "stats": {
                "nodes": sub.number_of_nodes(),
                "edges": sub.number_of_edges(),
            },
            "filter": {
                "types": filter_types,
                "focus_node": focus_node,
                "focus_depth": focus_depth,
            },
            "nodes": nodes,
            "edges": edges,
        }

        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(export_data, indent=2, ensure_ascii=False), encoding="utf-8")
        return str(output_path)

    # ── Utility ────────────────────────────────────────────────────

    def search_nodes(self, query: str) -> List[str]:
        """Search nodes by substring match.

        Args:
            query: Search string

        Returns:
            List of matching node IDs
        """
        self.ensure_loaded()
        query_lower = query.lower()
        return [n for n in self.graph.nodes() if query_lower in n.lower()]

    def merge_from_json(self, json_path: Path) -> int:
        """Merge edges from another graph.json file.

        Args:
            json_path: Path to another graph.json to merge

        Returns:
            Number of new edges added
        """
        self.ensure_loaded()

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        added = 0
        for edge in data.get("edges", []):
            if self.add_edge(
                edge["from"],
                edge["to"],
                edge.get("type", "related_to"),
                edge.get("weight", 1.0),
                edge.get("metadata", {}),
            ):
                added += 1

        return added

    def export_dot(self, output: str = "graph.dot") -> str:
        """Export graph to Graphviz DOT format.

        Args:
            output: Output DOT file path

        Returns:
            Path to generated DOT file
        """
        self.ensure_loaded()

        try:
            from networkx.drawing.nx_agraph import write_dot
        except ImportError:
            # Fallback: simple manual DOT export
            lines = ["digraph memory_graph {"]
            for u, v, data in self.graph.edges(data=True):
                etype = data.get("type", "related_to")
                weight = data.get("weight", 1.0)
                lines.append(f'  "{u}" -> "{v}" [label="{etype}" weight={weight}];')
            lines.append("}")

            output_path = Path(output)
            output_path.write_text("\n".join(lines), encoding="utf-8")
            return str(output_path)

        output_path = Path(output)
        write_dot(self.graph, str(output_path))
        return str(output_path)


def main():
    """Quick test / demo."""
    engine = GraphEngine()
    loaded = engine.load()

    if not loaded:
        print("No existing graph found. Creating demo graph...")
        # Demo data
        engine.add_edge("session_20260518", "task_fix_auth", "same_session")
        engine.add_edge("session_20260518", "bug_crash_login", "same_session")
        engine.add_edge("task_fix_auth", "bug_crash_login", "fixed_by")
        engine.add_edge("task_fix_auth", "commit_abc123", "implements")
        engine.add_edge("commit_abc123", "src/auth.ts", "modifies")
        engine.add_edge("src/auth.ts", "src/lib/jwt.ts", "imports")
        engine.add_edge("src/auth.ts", "REQ-001", "implements")
        engine.add_edge("task_fix_auth", "knowledge_jwt_best", "depends_on")
        engine.save()
        print(f"Demo graph saved to {engine.graph_path}")

    # Stats
    s = engine.stats()
    print(f"\nGraph Statistics:")
    print(f"  Nodes: {s['nodes']}")
    print(f"  Edges: {s['edges']}")
    print(f"  Density: {s['density']}")
    print(f"  Components: {s['weakly_connected_components']}")
    print(f"  Edge types: {s['edge_types']}")

    # Validate
    v = engine.validate()
    print(f"\nValidation: {'PASS' if v['valid'] else 'FAIL'}")
    if v["issues"]:
        for issue in v["issues"]:
            print(f"  [{issue['severity']}] {issue['type']}: {issue}")

    # Traversal demo
    path = engine.shortest_path("session_20260518", "src/lib/jwt.ts")
    if path:
        print(f"\nPath session -> jwt.ts: {' -> '.join(path)}")

    neighbors = engine.neighbors("task_fix_auth")
    print(f"Neighbors of task_fix_auth: {neighbors}")


if __name__ == "__main__":
    main()
