#!/usr/bin/env python3
"""
Standards Validation Script for Z.ai Agent Toolkit
Validates all 19 standards files against 10 structural and formatting rules.
"""

import os
import re
import sys
from pathlib import Path
from typing import NamedTuple


# ── Color helpers ────────────────────────────────────────────────────────────

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def green(text: str) -> str:
    return f"{GREEN}{text}{RESET}"


def red(text: str) -> str:
    return f"{RED}{text}{RESET}"


def yellow(text: str) -> str:
    return f"{YELLOW}{text}{RESET}"


def cyan(text: str) -> str:
    return f"{CYAN}{text}{RESET}"


def bold(text: str) -> str:
    return f"{BOLD}{text}{RESET}"


# ── Data structures ──────────────────────────────────────────────────────────

class CheckResult(NamedTuple):
    check_id: str
    check_name: str
    passed: bool
    details: str


class SectionInfo(NamedTuple):
    number: int | None
    raw_title: str  # everything after "## "
    line_number: int


# ── Parsing helpers ──────────────────────────────────────────────────────────

H2_PATTERN = re.compile(r"^##\s+(.+)$")
H2_NUMBERED_PATTERN = re.compile(r"^##\s+(\d+)\.\s+(.+)$")
HEADER_FIELD_PATTERN = re.compile(r"^>\s*(\w[\w\s]*?):\s*(.+)$")
MARKDOWN_LINK_PATTERN = re.compile(r"\[([^\]]+)\]\(#([^)]+)\)")
CROSS_REF_TABLE_HEADER = re.compile(r"\|\s*Standard\s*\|\s*Relationship\s*\|")


def strip_code_blocks(content: str) -> str:
    """Remove fenced code blocks (```...```) from content so ## headers
    inside code blocks are not treated as real document headers."""
    result_lines = []
    in_code_block = False
    for line in content.splitlines():
        # Detect fenced code block boundaries (``` with optional language tag)
        if re.match(r'^```', line):
            in_code_block = not in_code_block
            result_lines.append('')  # replace with blank line to preserve line numbers
            continue
        if in_code_block:
            result_lines.append('')  # blank out code block content
        else:
            result_lines.append(line)
    return '\n'.join(result_lines)


def parse_h2_sections(content: str) -> list[SectionInfo]:
    """Extract all ## headers with their line numbers and parsed numbers.
    Skips ## headers inside fenced code blocks."""
    cleaned = strip_code_blocks(content)
    sections = []
    for line_no, line in enumerate(cleaned.splitlines(), start=1):
        m = H2_PATTERN.match(line)
        if m:
            raw_title = m.group(1).strip()
            nm = H2_NUMBERED_PATTERN.match(line)
            number = int(nm.group(1)) if nm else None
            sections.append(SectionInfo(number=number, raw_title=raw_title, line_number=line_no))
    return sections


def is_version_history_entry(title: str) -> bool:
    """Check if a ### header looks like a version history entry (e.g. ### [1.2.0])."""
    return bool(re.match(r"^###\s*(\[.*\]|v?\d)", title))


def extract_header_fields(content: str) -> dict[str, str]:
    """Extract blockquote-style header fields (e.g. > ID: STD-xxx).
    Only reads fields before the first ## heading to avoid picking up
    example headers in later sections."""
    fields = {}
    for line in content.splitlines():
        # Stop at the first ## heading — header block is above it
        if re.match(r'^##\s+', line):
            break
        m = HEADER_FIELD_PATTERN.match(line)
        if m:
            key = m.group(1).strip().lower()
            val = m.group(2).strip()
            fields[key] = val
    return fields


def normalize_anchor(raw: str) -> str:
    """
    Approximate how GitHub converts a heading to an anchor.
    Lowercase, strip punctuation (except hyphens/spaces), spaces -> hyphens.
    """
    anchor = raw.lower()
    # Remove the number prefix like "1. " for anchor generation
    anchor = re.sub(r"^\d+\.\s*", "", anchor)
    # Remove formatting markers
    anchor = re.sub(r"[*`]", "", anchor)
    # Replace non-alphanumeric/non-hyphen/non-space with empty
    anchor = re.sub(r"[^\w\s-]", "", anchor)
    # Collapse whitespace and replace with hyphens
    anchor = re.sub(r"\s+", "-", anchor.strip())
    return anchor


# ── Check implementations ────────────────────────────────────────────────────

def check_1_numbered_sections(sections: list[SectionInfo]) -> CheckResult:
    """Check 1: Section Numbering Continuity - all ## headers must be numbered sequentially."""
    unnumbered = [s for s in sections if s.number is None]
    if unnumbered:
        lines = ", ".join(f"L{s.line_number}" for s in unnumbered)
        titles = "; ".join(f"'{s.raw_title}'" for s in unnumbered)
        return CheckResult(
            "1", "Section Numbering Continuity", False,
            f"Unnumbered ## headers at {lines}: {titles}"
        )
    return CheckResult("1", "Section Numbering Continuity", True, "All ## headers are numbered")


def check_2_no_unnumbered_h2(sections: list[SectionInfo]) -> CheckResult:
    """Check 2: No Unnumbered ## Headers - every ## must start with a number."""
    unnumbered = [s for s in sections if s.number is None]
    if unnumbered:
        lines = ", ".join(f"L{s.line_number}" for s in unnumbered)
        titles = "; ".join(f"'{s.raw_title}'" for s in unnumbered)
        return CheckResult(
            "2", "No Unnumbered ## Headers", False,
            f"Found unnumbered ## headers at {lines}: {titles}"
        )
    return CheckResult("2", "No Unnumbered ## Headers", True, "All ## headers start with a number")


def check_3_cross_references_last(sections: list[SectionInfo]) -> CheckResult:
    """Check 3: Cross-References Always Last - final numbered ## must be 'Cross-References'."""
    numbered = [s for s in sections if s.number is not None]
    if not numbered:
        return CheckResult(
            "3", "Cross-References Always Last", False,
            "No numbered sections found"
        )
    last = numbered[-1]
    if "cross-reference" not in last.raw_title.lower():
        return CheckResult(
            "3", "Cross-References Always Last", False,
            f"Last numbered section is '{last.raw_title}' (L{last.line_number}), expected 'Cross-References'"
        )
    return CheckResult(
        "3", "Cross-References Always Last", True,
        f"Last numbered section is '{last.raw_title}'"
    )


def check_4_version_history_before_crossrefs(sections: list[SectionInfo]) -> CheckResult:
    """Check 4: Version History Before Cross-References - must be penultimate if it exists."""
    numbered = [s for s in sections if s.number is not None]
    vh_sections = [s for s in numbered if "version history" in s.raw_title.lower()]
    cr_sections = [s for s in numbered if "cross-reference" in s.raw_title.lower()]

    if not vh_sections:
        return CheckResult(
            "4", "Version History Before Cross-References", True,
            "No Version History section (check not applicable)"
        )

    vh = vh_sections[0]

    if not cr_sections:
        return CheckResult(
            "4", "Version History Before Cross-References", False,
            f"Version History exists (L{vh.line_number}) but no Cross-References section found"
        )

    cr = cr_sections[0]

    # Cross-References must be the last numbered section
    if cr != numbered[-1]:
        return CheckResult(
            "4", "Version History Before Cross-References", False,
            f"Cross-References is not the last section (L{cr.line_number})"
        )

    # Version History must be the penultimate (second to last) numbered section
    if len(numbered) < 2:
        return CheckResult(
            "4", "Version History Before Cross-References", False,
            "Not enough sections for Version History to be penultimate"
        )

    penultimate = numbered[-2]
    if penultimate != vh:
        return CheckResult(
            "4", "Version History Before Cross-References", False,
            f"Version History (L{vh.line_number}) is not the penultimate section; "
            f"penultimate is '{penultimate.raw_title}' (L{penultimate.line_number})"
        )

    return CheckResult(
        "4", "Version History Before Cross-References", True,
        f"Version History (L{vh.line_number}) is immediately before Cross-References"
    )


def check_5_references_before_vh_and_cr(sections: list[SectionInfo]) -> CheckResult:
    """Check 5: References Before Version History and Cross-References."""
    numbered = [s for s in sections if s.number is not None]
    ref_sections = [s for s in numbered if s.raw_title.lower() == "references"]
    vh_sections = [s for s in numbered if "version history" in s.raw_title.lower()]
    cr_sections = [s for s in numbered if "cross-reference" in s.raw_title.lower()]

    if not ref_sections:
        return CheckResult(
            "5", "References Before Version History/Cross-References", True,
            "No References section (check not applicable)"
        )

    ref = ref_sections[0]
    issues = []

    if vh_sections:
        vh = vh_sections[0]
        if ref.number >= vh.number:
            issues.append(
                f"References (#{ref.number}, L{ref.line_number}) must come before "
                f"Version History (#{vh.number}, L{vh.line_number})"
            )

    if cr_sections:
        cr = cr_sections[0]
        if ref.number >= cr.number:
            issues.append(
                f"References (#{ref.number}, L{ref.line_number}) must come before "
                f"Cross-References (#{cr.number}, L{cr.line_number})"
            )

    if issues:
        return CheckResult(
            "5", "References Before Version History/Cross-References", False,
            "; ".join(issues)
        )

    return CheckResult(
        "5", "References Before Version History/Cross-References", True,
        f"References (#{ref.number}) is before Version History and Cross-References"
    )


def check_6_standard_header(content: str, filename: str) -> CheckResult:
    """Check 6: Standard Header Present - YAML-like header with key fields."""
    fields = extract_header_fields(content)

    # Check for ID field (standard_id or id)
    has_id = any(k in fields for k in ["id", "standard_id"])
    # Check for Version field
    has_version = "version" in fields
    # Check for Level field
    has_level = "level" in fields

    # Also check for # Standard: line at top
    has_title = bool(re.match(r"^#\s+Standard:", content, re.MULTILINE))

    missing = []
    if not has_title:
        missing.append("title line (# Standard: ...)")
    if not has_id:
        missing.append("ID field (> ID: ...)")
    if not has_version:
        missing.append("Version field (> Version: ...)")
    if not has_level:
        missing.append("Level field (> Level: ...)")

    if missing:
        return CheckResult(
            "6", "Standard Header Present", False,
            f"Missing: {', '.join(missing)}"
        )

    return CheckResult(
        "6", "Standard Header Present", True,
        f"Header has title, ID ({fields.get('id', fields.get('standard_id', '?'))}), "
        f"version ({fields['version']}), level"
    )


def check_7_cross_references_table(content: str, sections: list[SectionInfo]) -> CheckResult:
    """Check 7: Cross-References Table Format - must have | Standard | Relationship | table."""
    cr_sections = [s for s in sections if "cross-reference" in s.raw_title.lower()]

    if not cr_sections:
        return CheckResult(
            "7", "Cross-References Table Format", False,
            "No Cross-References section found"
        )

    cr_section = cr_sections[0]

    # Use code-block-stripped content for section detection,
    # but keep original content lines for table analysis
    cleaned = strip_code_blocks(content)
    cleaned_lines = cleaned.splitlines()
    original_lines = content.splitlines()

    # Collect content from Cross-References section until next ## or end
    # Use cleaned lines to find section boundaries, but read table from original
    cr_content_lines = []
    in_section = False
    for i, line in enumerate(cleaned_lines):
        if re.match(r"^##\s+", line):
            if in_section:
                break
            if "cross-reference" in line.lower():
                in_section = True
                continue
        if in_section and i < len(original_lines):
            cr_content_lines.append(original_lines[i])

    cr_content = "\n".join(cr_content_lines)

    if not CROSS_REF_TABLE_HEADER.search(cr_content):
        # Also check for alternate table format (e.g., | Domain | Standard | ...)
        alt_header = re.search(r'\|[^|]+\|[^|]+\|', cr_content)
        if alt_header:
            return CheckResult(
                "7", "Cross-References Table Format", False,
                f"Cross-References section (L{cr_section.line_number}) has table but "
                f"not in required '| Standard | Relationship |' format; "
                f"found: {alt_header.group(0).strip()}"
            )
        return CheckResult(
            "7", "Cross-References Table Format", False,
            f"Cross-References section (L{cr_section.line_number}) does not contain "
            f"the required table header '| Standard | Relationship |'"
        )

    return CheckResult(
        "7", "Cross-References Table Format", True,
        f"Cross-References section contains proper table format"
    )


def check_8_no_duplicate_section_numbers(sections: list[SectionInfo]) -> CheckResult:
    """Check 8: No Duplicate Section Numbers."""
    numbered = [s for s in sections if s.number is not None]
    seen: dict[int, str] = {}
    duplicates = []

    for s in numbered:
        if s.number in seen:
            duplicates.append(
                f"Section #{s.number} appears multiple times: "
                f"L{seen[s.number]} and L{s.line_number}"
            )
        else:
            seen[s.number] = str(s.line_number)

    if duplicates:
        return CheckResult(
            "8", "No Duplicate Section Numbers", False,
            "; ".join(duplicates)
        )

    return CheckResult("8", "No Duplicate Section Numbers", True, "All section numbers are unique")


def check_9_sequential_numbering(sections: list[SectionInfo]) -> CheckResult:
    """Check 9: Sequential Numbering - must be 1, 2, 3, ... with no skips."""
    numbered = [s for s in sections if s.number is not None]

    if not numbered:
        return CheckResult(
            "9", "Sequential Numbering", False,
            "No numbered sections found"
        )

    numbers = [s.number for s in numbered]
    expected = list(range(1, len(numbers) + 1))
    skips = []

    for i, (actual, exp) in enumerate(zip(numbers, expected)):
        if actual != exp:
            skips.append(f"Expected #{exp}, found #{actual} at L{numbered[i].line_number}")

    if skips:
        # Also detect gaps (e.g., 1,2,4 instead of 1,2,3)
        number_set = set(numbers)
        max_num = max(numbers)
        gaps = [n for n in range(1, max_num + 1) if n not in number_set]
        gap_msg = f" (gaps at: {gaps})" if gaps else ""
        return CheckResult(
            "9", "Sequential Numbering", False,
            f"Non-sequential numbering: {'; '.join(skips)}{gap_msg}"
        )

    return CheckResult(
        "9", "Sequential Numbering", True,
        f"Sections numbered 1-{len(numbered)} sequentially"
    )


def check_10_internal_link_consistency(content: str, sections: list[SectionInfo]) -> CheckResult:
    """Check 10: Internal Link Consistency - markdown links must reference existing sections."""
    # Strip code blocks before searching for links to avoid false matches
    cleaned = strip_code_blocks(content)
    links = MARKDOWN_LINK_PATTERN.findall(cleaned)

    if not links:
        return CheckResult(
            "10", "Internal Link Consistency", True,
            "No internal markdown links found"
        )

    # Build set of valid anchors from section titles
    valid_anchors = set()
    for s in sections:
        anchor = normalize_anchor(s.raw_title)
        if anchor:
            valid_anchors.add(anchor)

    # Also add anchors with the number prefix format (e.g., "1-introduction")
    for s in sections:
        if s.number is not None:
            # Extract title without number
            nm = H2_NUMBERED_PATTERN.match(f"## {s.raw_title}")
            if nm:
                title_only = nm.group(2)
                anchor = normalize_anchor(title_only)
                if anchor:
                    valid_anchors.add(f"{s.number}-{anchor}")

    broken = []
    for link_text, link_anchor in links:
        # Normalize the anchor the same way
        normalized = link_anchor.lower().strip()
        # Remove trailing dashes
        normalized = normalized.rstrip("-")

        # Check if this anchor matches any section
        found = False
        for va in valid_anchors:
            va_normalized = va.lower().rstrip("-")
            if va_normalized == normalized or va_normalized.endswith(normalized):
                found = True
                break

        if not found:
            # Try a more lenient match
            for va in valid_anchors:
                va_normalized = va.lower().replace("-", "")
                target_normalized = normalized.replace("-", "")
                if va_normalized == target_normalized:
                    found = True
                    break

        if not found:
            broken.append(f"[{link_text}](#{link_anchor})")

    if broken:
        return CheckResult(
            "10", "Internal Link Consistency", False,
            f"Broken internal links: {', '.join(broken[:5])}"
            + (f" ... and {len(broken) - 5} more" if len(broken) > 5 else "")
        )

    return CheckResult(
        "10", "Internal Link Consistency", True,
        f"All {len(links)} internal links reference existing sections"
    )


# ── Main validation logic ────────────────────────────────────────────────────

def validate_file(filepath: Path) -> list[CheckResult]:
    """Run all 10 checks on a single standards file."""
    content = filepath.read_text(encoding="utf-8")
    sections = parse_h2_sections(content)

    results = [
        check_1_numbered_sections(sections),
        check_2_no_unnumbered_h2(sections),
        check_3_cross_references_last(sections),
        check_4_version_history_before_crossrefs(sections),
        check_5_references_before_vh_and_cr(sections),
        check_6_standard_header(content, filepath.name),
        check_7_cross_references_table(content, sections),
        check_8_no_duplicate_section_numbers(sections),
        check_9_sequential_numbering(sections),
        check_10_internal_link_consistency(content, sections),
    ]

    return results


def main():
    script_dir = Path(__file__).resolve().parent
    standards_dir = script_dir / "standards"

    if not standards_dir.is_dir():
        print(red(f"ERROR: standards/ directory not found at {standards_dir}"))
        sys.exit(1)

    # Collect all .md files in standards/
    md_files = sorted(standards_dir.glob("*.md"))

    if not md_files:
        print(red(f"ERROR: No .md files found in {standards_dir}"))
        sys.exit(1)

    print(bold("=" * 80))
    print(bold("  STANDARDS VALIDATION REPORT"))
    print(bold("=" * 80))
    print(f"  Standards directory: {standards_dir}")
    print(f"  Files found: {len(md_files)}")
    print(bold("=" * 80))
    print()

    total_checks = 0
    total_passes = 0
    total_fails = 0
    file_summaries: list[tuple[str, int, int]] = []

    for filepath in md_files:
        rel_path = filepath.relative_to(script_dir)
        results = validate_file(filepath)

        passes = sum(1 for r in results if r.passed)
        fails = sum(1 for r in results if not r.passed)
        total_checks += len(results)
        total_passes += passes
        total_fails += fails
        file_summaries.append((str(rel_path), passes, fails))

        # File header
        status_icon = green("PASS") if fails == 0 else red("FAIL")
        print(bold(f"  {rel_path}") + f"  [{status_icon}]  {passes}/{len(results)} passed")
        print("  " + "-" * 76)

        for r in results:
            mark = green("PASS") if r.passed else red("FAIL")
            print(f"    [{mark}] {r.check_id}. {r.check_name}")
            if not r.passed:
                print(f"           " + red(f"-> {r.details}"))
            else:
                print(f"           " + f"  {r.details}")
        print()

    # ── Summary ──────────────────────────────────────────────────────────────

    print(bold("=" * 80))
    print(bold("  SUMMARY"))
    print(bold("=" * 80))
    print()

    # Per-file summary
    print(f"  {'File':<50} {'Pass':>6} {'Fail':>6}")
    print(f"  {'-' * 50} {'-' * 6} {'-' * 6}")
    for rel_path, passes, fails in file_summaries:
        status = green(f"{passes:>6}") + " " + (red(f"{fails:>6}") if fails > 0 else green(f"{fails:>6}"))
        print(f"  {rel_path:<50} {status}")

    print()
    print(f"  Total checks:  {total_checks}")
    print(f"  " + green(f"Passed:        {total_passes}"))
    print(f"  " + red(f"Failed:        {total_fails}"))
    print()

    # Files with failures
    failed_files = [(rp, p, f) for rp, p, f in file_summaries if f > 0]
    if failed_files:
        print(bold("  Files with failures:"))
        for rel_path, _, fails in failed_files:
            print(f"    " + red(f"- {rel_path} ({fails} failures)"))
        print()

    print(bold("=" * 80))
    if total_fails == 0:
        print(bold(green("  ALL CHECKS PASSED")))
        print(bold("=" * 80))
        sys.exit(0)
    else:
        print(bold(red(f"  {total_fails} CHECK(S) FAILED")))
        print(bold("=" * 80))
        sys.exit(1)


if __name__ == "__main__":
    main()
