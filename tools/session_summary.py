#!/usr/bin/env python3
"""
Session Summary Generator for ZCODE Memory System.

Generates experience reports from sandbox sessions and stores them as
'experience' entries in ChromaDB. Each report captures:

  - WHAT was done (tasks attempted)
  - WHAT WORKED (successes, breakthroughs)
  - WHAT FAILED (dead ends, mistakes, anti-patterns)
  - WHY (root cause analysis)
  - VERIFICATION STATUS (unverified / verified / conflict)

Usage:
    python session_summary.py from-worklog <worklog_path>
    python session_summary.py manual --title "..." --good "..." --bad "..." --why "..."
    python session_summary.py list
    python session_summary.py query <search_term>
    python session_summary.py verify <entry_id> --status verified|conflict
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# Add tools dir to path
TOOLS_DIR = Path(__file__).parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from memory_cli import get_client, store_entry, ENTRY_TYPES


# ── Worklog Parser ────────────────────────────────────────

def parse_worklog(worklog_path: str) -> List[Dict]:
    """
    Parse worklog.md into structured session records.
    Format: sections separated by '---' with Task ID / Agent / Task / Work Log / Stage Summary.
    """
    with open(worklog_path, 'r') as f:
        content = f.read()

    records = []
    sections = re.split(r'^---\s*$', content, flags=re.MULTILINE)

    for section in sections:
        section = section.strip()
        if not section:
            continue

        record = {
            "task_id": "",
            "agent": "",
            "task": "",
            "work_log": [],
            "stage_summary": [],
            "raw": section,
        }

        lines = section.split('\n')
        current_field = None

        for line in lines:
            line_stripped = line.strip()

            if line_stripped.startswith("Task ID:"):
                record["task_id"] = line_stripped.replace("Task ID:", "").strip()
                current_field = None
            elif line_stripped.startswith("Agent:"):
                record["agent"] = line_stripped.replace("Agent:", "").strip()
                current_field = None
            elif line_stripped.startswith("Task:"):
                record["task"] = line_stripped.replace("Task:", "").strip()
                current_field = None
            elif line_stripped.startswith("Work Log:"):
                current_field = "work_log"
            elif line_stripped.startswith("Stage Summary:"):
                current_field = "stage_summary"
            elif line_stripped.startswith("- ") and current_field == "work_log":
                record["work_log"].append(line_stripped[2:].strip())
            elif line_stripped.startswith("- ") and current_field == "stage_summary":
                record["stage_summary"].append(line_stripped[2:].strip())

        if record["task_id"] or record["task"]:
            records.append(record)

    return records


def analyze_session(records: List[Dict]) -> Dict:
    """
    Analyze worklog records and classify outcomes.

    Heuristics:
    - Keywords in work_log / stage_summary indicate success/failure
    - Patterns like "tried X, didn't work" → failed approach
    - Patterns like "solved", "fixed", "working" → success
    - Multiple approaches to same problem → pivot point
    """
    analysis = {
        "tasks_attempted": [],
        "what_worked": [],
        "what_failed": [],
        "why_analysis": [],
        "pivots": [],
        "technologies": set(),
        "duration_estimate": "",
    }

    # Success/failure keywords
    success_words = {
        "solved", "fixed", "working", "success", "done", "completed",
        "verified", "passed", "implemented", "shipped", "deployed",
        "resolved", "achieved", "optimized", "improved", "added",
    }
    failure_words = {
        "failed", "error", "didn't work", "not working", "broken",
        "timeout", "crash", "blocked", "skipped", "abandoned",
        "gave up", "workaround", "hack", "dirty fix", "through the ass",
        "через жопу", "не получилось", "не вышло", "не сработало",
    }
    pivot_words = {
        "instead", "alternative", "different approach", "switched to",
        "rethought", "reconsidered", "pivoted", "зашли через дверь",
        "другой подход", "решили по-другому",
    }
    why_words = {
        "because", "reason", "due to", "caused by", "root cause",
        "because of", "turns out", "actually", "проблема в том",
        "потому что", "оказалось", "причина",
    }

    tech_pattern = re.compile(
        r'\b(python|typescript|javascript|react|next\.?js|node\.?js|prisma|'
        r'docker|chromadb|postgresql|mysql|redis|tailwind|rust|go|golang|'
        r'git|github|vercel|netlify|supabase|firebase|mongodb)\b',
        re.IGNORECASE
    )

    for record in records:
        task = record.get("task", "")
        task_id = record.get("task_id", "")
        agent = record.get("agent", "")

        all_text = " ".join(
            record.get("work_log", []) + record.get("stage_summary", [])
        ).lower()

        # Extract technologies
        for match in tech_pattern.finditer(all_text):
            analysis["technologies"].add(match.group(1).lower().replace(".js", "js"))

        # Classify task outcome
        task_entry = {
            "task_id": task_id,
            "agent": agent,
            "description": task,
            "outcome": "unknown",
        }

        has_success = any(w in all_text for w in success_words)
        has_failure = any(w in all_text for w in failure_words)

        if has_success and not has_failure:
            task_entry["outcome"] = "success"
        elif has_failure and not has_success:
            task_entry["outcome"] = "failure"
        elif has_failure and has_success:
            task_entry["outcome"] = "mixed"  # failed first, then succeeded
        else:
            task_entry["outcome"] = "unknown"

        analysis["tasks_attempted"].append(task_entry)

        # Extract what worked
        for line in record.get("stage_summary", []):
            line_lower = line.lower()
            if any(w in line_lower for w in success_words):
                analysis["what_worked"].append({
                    "task_id": task_id,
                    "description": line,
                })

        # Extract what failed
        for line in record.get("work_log", []) + record.get("stage_summary", []):
            line_lower = line.lower()
            if any(w in line_lower for w in failure_words):
                analysis["what_failed"].append({
                    "task_id": task_id,
                    "description": line,
                })

        # Extract pivots
        for line in record.get("work_log", []) + record.get("stage_summary", []):
            line_lower = line.lower()
            if any(w in line_lower for w in pivot_words):
                analysis["pivots"].append({
                    "task_id": task_id,
                    "description": line,
                })

        # Extract WHY
        for line in record.get("work_log", []) + record.get("stage_summary", []):
            line_lower = line.lower()
            if any(w in line_lower for w in why_words):
                analysis["why_analysis"].append({
                    "task_id": task_id,
                    "description": line,
                })

    analysis["technologies"] = sorted(analysis["technologies"])
    return analysis


def generate_experience_report(analysis: Dict, source: str = "worklog") -> Dict:
    """
    Generate structured experience report from analysis.
    This is the core output — a best-practice entry with good/bad examples.
    """
    # Build human-readable report
    parts = []

    parts.append(f"# Session Experience Report")
    parts.append(f"Source: {source}")
    parts.append(f"Generated: {datetime.now().isoformat()}")
    parts.append("")

    # Tasks overview
    tasks = analysis.get("tasks_attempted", [])
    parts.append(f"## Tasks Attempted ({len(tasks)})")
    for t in tasks:
        emoji = {"success": "+", "failure": "-", "mixed": "~", "unknown": "?"}.get(t["outcome"], "?")
        parts.append(f"  [{emoji}] {t['task_id']}: {t['description'][:100]}")
    parts.append("")

    # What worked
    worked = analysis.get("what_worked", [])
    if worked:
        parts.append(f"## What Worked ({len(worked)})")
        for w in worked:
            parts.append(f"  + {w['description'][:150]}")
        parts.append("")

    # What failed
    failed = analysis.get("what_failed", [])
    if failed:
        parts.append(f"## What Failed ({len(failed)})")
        for f in failed:
            parts.append(f"  - {f['description'][:150]}")
        parts.append("")

    # Pivots
    pivots = analysis.get("pivots", [])
    if pivots:
        parts.append(f"## Pivots ({len(pivots)})")
        for p in pivots:
            parts.append(f"  ~ {p['description'][:150]}")
        parts.append("")

    # WHY analysis
    why = analysis.get("why_analysis", [])
    if why:
        parts.append(f"## Root Cause Analysis ({len(why)})")
        for w in why:
            parts.append(f"  ! {w['description'][:150]}")
        parts.append("")

    report_text = "\n".join(parts)

    # Count outcomes
    success_count = sum(1 for t in tasks if t["outcome"] == "success")
    failure_count = sum(1 for t in tasks if t["outcome"] == "failure")
    mixed_count = sum(1 for t in tasks if t["outcome"] == "mixed")

    # Determine overall verdict
    if failure_count > success_count and mixed_count == 0:
        verdict = "mostly_failed"
    elif success_count > 0 and failure_count == 0:
        verdict = "mostly_succeeded"
    elif mixed_count > 0:
        verdict = "mixed_with_pivots"
    else:
        verdict = "inconclusive"

    return {
        "report_text": report_text,
        "metadata": {
            "source": source,
            "verification_status": "unverified",
            "experience_type": "session_summary",
            "verdict": verdict,
            "tasks_total": str(len(tasks)),
            "tasks_success": str(success_count),
            "tasks_failure": str(failure_count),
            "tasks_mixed": str(mixed_count),
            "what_worked_count": str(len(worked)),
            "what_failed_count": str(len(failed)),
            "pivots_count": str(len(pivots)),
            "technologies": ",".join(analysis.get("technologies", [])),
            "tags": ",".join(
                analysis.get("technologies", []) +
                [verdict, "session_summary", "experience"]
            ),
        },
    }


def store_experience_report(report: Dict) -> str:
    """Store experience report in ChromaDB."""
    entry_id = store_entry(
        "experience",
        report["report_text"],
        metadata=report["metadata"],
    )
    return entry_id


def query_experiences(query: str, limit: int = 5):
    """Search experience entries."""
    client = get_client()
    try:
        collection = client.get_collection(name="experience")
    except Exception:
        print("No 'experience' collection found. Run init first.")
        return []

    result = collection.query(
        query_texts=[query],
        n_results=limit,
    )

    if not result["ids"] or not result["ids"][0]:
        print("No experience entries found.")
        return []

    print(f"\nExperience search: '{query}'")
    print("=" * 60)

    for i, doc_id in enumerate(result["ids"][0]):
        metadata = result["metadatas"][0][i] if result["metadatas"] else {}
        document = result["documents"][0][i] if result["documents"] else ""
        distance = result["distances"][0][i] if result.get("distances") else 0

        print(f"\n[{i+1}] ID: {doc_id}")
        print(f"    Distance: {distance:.4f}")
        print(f"    Verdict: {metadata.get('verdict', 'N/A')}")
        print(f"    Verification: {metadata.get('verification_status', 'N/A')}")
        print(f"    Successes: {metadata.get('what_worked_count', '?')}")
        print(f"    Failures: {metadata.get('what_failed_count', '?')}")
        print(f"    Tech: {metadata.get('technologies', 'N/A')}")
        print(f"    Preview: {document[:200]}...")

    return result


def list_experiences(limit: int = 20):
    """List all experience entries."""
    client = get_client()
    try:
        collection = client.get_collection(name="experience")
    except Exception:
        print("No 'experience' collection found.")
        return

    result = collection.get(limit=limit)

    if not result["ids"]:
        print("No experience entries yet.")
        return

    print(f"\nExperience Entries ({len(result['ids'])})")
    print("=" * 60)

    for i, doc_id in enumerate(result["ids"]):
        metadata = result["metadatas"][i] if result["metadatas"] else {}
        document = result["documents"][i] if result["documents"] else ""

        verdict = metadata.get("verdict", "?")
        verified = metadata.get("verification_status", "unverified")
        tech = metadata.get("technologies", "")
        success = metadata.get("what_worked_count", "?")
        failure = metadata.get("what_failed_count", "?")

        marker = {"verified": "V", "unverified": "?", "conflict": "X"}.get(verified, "?")
        v_marker = {"mostly_succeeded": "+", "mostly_failed": "-", "mixed_with_pivots": "~"}.get(verdict, "?")

        print(f"\n[{marker}{v_marker}] {doc_id}")
        print(f"    {success} good / {failure} bad | {tech}")
        print(f"    {document[:120]}...")


def verify_experience(entry_id: str, status: str):
    """Update verification status of an experience entry."""
    if status not in ("verified", "unverified", "conflict"):
        print(f"ERROR: Invalid status. Use: verified, unverified, conflict")
        sys.exit(1)

    client = get_client()
    collection = client.get_collection(name="experience")

    try:
        result = collection.get(ids=[entry_id])
    except Exception:
        print(f"Entry not found: {entry_id}")
        return

    if not result["ids"]:
        print(f"Entry not found: {entry_id}")
        return

    # Update metadata
    old_metadata = result["metadatas"][0]
    old_metadata["verification_status"] = status
    old_metadata["verified_at"] = datetime.now().isoformat()

    # ChromaDB requires update with same id
    collection.update(
        ids=[entry_id],
        metadatas=[old_metadata],
        documents=result["documents"],
    )

    print(f"Updated {entry_id}: verification_status = {status}")


# ── Manual Experience Entry ───────────────────────────────

def create_manual_experience(
    title: str,
    good: str = "",
    bad: str = "",
    why: str = "",
    technologies: str = "",
    verdict: str = "inconclusive",
) -> str:
    """
    Create an experience entry manually (not from worklog).
    For cases where you just KNOW something and want to record it.
    """
    parts = [f"# {title}", ""]

    if good:
        parts.append("## What Worked")
        for line in good.replace("\\n", "|").split("|"):
            line = line.strip()
            if line:
                parts.append(f"  + {line}")
        parts.append("")

    if bad:
        parts.append("## What Failed")
        for line in bad.replace("\\n", "|").split("|"):
            line = line.strip()
            if line:
                parts.append(f"  - {line}")
        parts.append("")

    if why:
        parts.append("## Root Cause Analysis")
        for line in why.replace("\\n", "|").split("|"):
            line = line.strip()
            if line:
                parts.append(f"  ! {line}")
        parts.append("")

    report_text = "\n".join(parts)

    techs = [t.strip() for t in technologies.split(",") if t.strip()] if technologies else []
    tags = techs + [verdict, "manual_entry", "experience"]

    report = {
        "report_text": report_text,
        "metadata": {
            "source": "manual",
            "verification_status": "unverified",
            "experience_type": "manual_entry",
            "verdict": verdict,
            "technologies": ",".join(techs),
            "tags": ",".join(tags),
            "what_worked_count": str(len([l for l in good.replace("\\n", "|").split("|") if l.strip()])) if good else "0",
            "what_failed_count": str(len([l for l in bad.replace("\\n", "|").split("|") if l.strip()])) if bad else "0",
        },
    }

    return store_experience_report(report)


# ── Session Log Entry ─────────────────────────────────────

def create_session_log(
    title: str,
    tasks: str = "",
    errors: str = "",
    files: str = "",
    duration: str = "",
    result: str = "partial",
) -> str:
    """
    Create a session log entry (stored in 'session' collection).
    This is a factual record of what was done, not lessons learned.
    """
    parts = [f"# {title}", ""]

    if tasks:
        parts.append("## Tasks")
        for line in tasks.replace("\\n", "|").split("|"):
            line = line.strip()
            if line:
                parts.append(f"  - {line}")
        parts.append("")

    if errors:
        parts.append("## Errors")
        for line in errors.replace("\\n", "|").split("|"):
            line = line.strip()
            if line:
                parts.append(f"  ! {line}")
        parts.append("")

    if files:
        parts.append("## Files Modified")
        for line in files.replace("\\n", "|").split("|"):
            line = line.strip()
            if line:
                parts.append(f"  * {line}")
        parts.append("")

    parts.append(f"Duration: {duration or 'unknown'}")
    parts.append(f"Result: {result}")

    log_text = "\n".join(parts)

    task_count = len([l for l in tasks.replace("\\n", "|").split("|") if l.strip()]) if tasks else 0
    error_count = len([l for l in errors.replace("\\n", "|").split("|") if l.strip()]) if errors else 0

    metadata = {
        "source": "manual_log",
        "type": "session",
        "session_type": "log",
        "result": result,
        "duration": duration,
        "tasks_count": str(task_count),
        "errors_count": str(error_count),
        "tags": f"session_log,{result}",
    }

    # Store in 'session' collection
    client = get_client()
    collection = client.get_or_create_collection(name="session", metadata={"type": "session"})

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    entry_id = f"session_{timestamp}"

    metadata["created_at"] = datetime.now().isoformat()

    collection.add(
        documents=[log_text],
        metadatas=[metadata],
        ids=[entry_id],
    )

    return entry_id


# ── CLI ───────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Session Summary & Experience Generator for ZCODE Memory System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python session_summary.py from-worklog /path/to/worklog.md
    python session_summary.py manual --title "Deploy hell" --good "Vercel CLI works" --bad "SQLite on production" --why "Serverless can't write to disk"
    python session_summary.py list
    python session_summary.py query "deployment failure"
    python session_summary.py verify experience_20260519_123456 --status verified
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # from-worklog
    wl_p = subparsers.add_parser("from-worklog", help="Generate experience report from worklog.md")
    wl_p.add_argument("worklog_path", help="Path to worklog.md file")
    wl_p.add_argument("--source", "-s", default="", help="Source tag")

    # manual
    man_p = subparsers.add_parser("manual", help="Create manual experience entry")
    man_p.add_argument("--title", required=True, help="Title for the experience")
    man_p.add_argument("--good", default="", help="What worked (newline-separated)")
    man_p.add_argument("--bad", default="", help="What failed (newline-separated)")
    man_p.add_argument("--why", default="", help="Root cause analysis")
    man_p.add_argument("--tech", default="", help="Comma-separated technologies")
    man_p.add_argument("--verdict", default="inconclusive",
                       choices=["mostly_succeeded", "mostly_failed", "mixed_with_pivots", "inconclusive"])

    # list
    list_p = subparsers.add_parser("list", help="List experience entries")
    list_p.add_argument("--limit", "-n", type=int, default=20)

    # query
    q_p = subparsers.add_parser("query", help="Search experience entries")
    q_p.add_argument("search_term", help="Search query")
    q_p.add_argument("--limit", "-n", type=int, default=5)

    # verify
    v_p = subparsers.add_parser("verify", help="Update verification status")
    v_p.add_argument("entry_id", help="Entry ID to verify")
    v_p.add_argument("--status", required=True,
                     choices=["verified", "unverified", "conflict"],
                     help="New verification status")

    # log
    log_p = subparsers.add_parser("log", help="Create session log entry (factual record)")
    log_p.add_argument("--title", required=True, help="Short summary of session focus")
    log_p.add_argument("--tasks", default="", help="What was attempted (| separated)")
    log_p.add_argument("--errors", default="", help="What went wrong (| separated)")
    log_p.add_argument("--files", default="", help="Files modified (| separated)")
    log_p.add_argument("--duration", default="", help="Approximate time (e.g. 3h)")
    log_p.add_argument("--result", default="partial",
                       choices=["completed", "partial", "blocked", "abandoned"],
                       help="Overall outcome")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Ensure experience collection exists
    client = get_client()
    client.get_or_create_collection(name="experience", metadata={"type": "experience"})

    if args.command == "from-worklog":
        worklog_path = args.worklog_path
        if not Path(worklog_path).exists():
            print(f"ERROR: File not found: {worklog_path}")
            sys.exit(1)

        print(f"Parsing worklog: {worklog_path}")
        records = parse_worklog(worklog_path)
        print(f"  Found {len(records)} task records")

        if not records:
            print("No records found in worklog.")
            sys.exit(0)

        analysis = analyze_session(records)
        report = generate_experience_report(analysis, source=args.source or worklog_path)

        print("\n" + "=" * 60)
        print(report["report_text"])
        print("=" * 60)

        entry_id = store_experience_report(report)
        print(f"\nStored as: {entry_id}")

    elif args.command == "manual":
        entry_id = create_manual_experience(
            title=args.title,
            good=args.good,
            bad=args.bad,
            why=args.why,
            technologies=args.tech,
            verdict=args.verdict,
        )
        print(f"Stored as: {entry_id}")

    elif args.command == "list":
        list_experiences(limit=args.limit)

    elif args.command == "query":
        query_experiences(args.search_term, limit=args.limit)

    elif args.command == "verify":
        verify_experience(args.entry_id, args.status)

    elif args.command == "log":
        entry_id = create_session_log(
            title=args.title,
            tasks=args.tasks,
            errors=args.errors,
            files=args.files,
            duration=args.duration,
            result=args.result,
        )
        print(f"[LOG] Saved: \"{args.title}\" ({args.tasks.count(chr(124))+1 if args.tasks else 0} tasks, {args.errors.count(chr(124))+1 if args.errors else 0} errors, {args.result})")
        print(f"Stored as: {entry_id}")


if __name__ == "__main__":
    main()
