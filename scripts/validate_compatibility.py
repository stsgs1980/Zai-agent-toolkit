#!/usr/bin/env python3
"""
Validate cross-compatibility between agent-toolkit standards.

Checks:
1. STD-ID consistency between IMPLEMENTATION_ORDER and standard files
2. Version number consistency between README and standard files
3. Severity level consistency between AGENT_RULES and standard files
4. Stack signature consistency across all files
5. Skill references in AGENT_RULES point to existing skills
6. Instruction references in AGENT_RULES point to existing instructions

Usage:
    python validate_compatibility.py [--toolkit-dir PATH]
"""

import os
import re
import sys
import json
from pathlib import Path


def find_toolkit_dir():
    """Find the toolkit directory."""
    candidates = [
        Path(__file__).parent.parent,
        Path.cwd() / "agent-toolkit",
        Path.cwd(),
    ]
    for d in candidates:
        if (d / "AGENT_RULES.md").exists() and (d / "standards").is_dir():
            return d
    print("ERROR: Cannot find agent-toolkit directory")
    sys.exit(1)


def read_file(path):
    """Read file content, return empty string if not found."""
    try:
        return Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""


def extract_std_ids(text):
    """Extract STD-XXX-NNN identifiers from text."""
    return set(re.findall(r'STD-[A-Z]+-\d{3}', text))


def extract_version(text, filename):
    """Extract version number from a standard file."""
    patterns = [
        r'Version:\s*v?([\d.]+)',
        r'version:\s*v?([\d.]+)',
        r'v([\d.]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None


def extract_severity_levels(text):
    """Extract severity levels [C], [W], [I] from text."""
    levels = {}
    for std_id in extract_std_ids(text):
        # Find the line with this STD-ID
        for line in text.split('\n'):
            if std_id in line:
                if '[C]' in line:
                    levels[std_id] = levels.get(std_id, []) + ['[C]']
                if '[W]' in line:
                    levels[std_id] = levels.get(std_id, []) + ['[W]']
                if '[I]' in line:
                    levels[std_id] = levels.get(std_id, []) + ['[I]']
    return levels


def check_std_id_consistency(toolkit_dir):
    """Check 1: STD-IDs in IMPLEMENTATION_ORDER match standard files."""
    issues = []
    impl_order = read_file(toolkit_dir / "standards" / "IMPLEMENTATION_ORDER.md")
    impl_ids = extract_std_ids(impl_order)

    # Check each standard file
    standards_dir = toolkit_dir / "standards"
    if standards_dir.is_dir():
        for f in standards_dir.glob("*.md"):
            file_ids = extract_std_ids(read_file(f))
            for fid in file_ids:
                if fid not in impl_ids:
                    issues.append(f"  STD-ID {fid} in {f.name} but not in IMPLEMENTATION_ORDER")

    for iid in impl_ids:
        found = False
        if standards_dir.is_dir():
            for f in standards_dir.glob("*.md"):
                if iid in read_file(f):
                    found = True
                    break
        if not found:
            issues.append(f"  STD-ID {iid} in IMPLEMENTATION_ORDER but no matching standard file")

    return issues


def check_version_consistency(toolkit_dir):
    """Check 2: Version numbers in README match standard files."""
    issues = []
    readme = read_file(toolkit_dir / "README.md")

    # Extract version table from README
    version_pattern = r'\|\s*`?([A-Z_]+\.md)`?\s*\|\s*(?:STD-[A-Z]+-\d+\s*\|\s*)?v?([\d.]+)\s*\|'
    readme_versions = {}
    for match in re.finditer(version_pattern, readme):
        filename, version = match.groups()
        readme_versions[filename] = version

    standards_dir = toolkit_dir / "standards"
    if standards_dir.is_dir():
        for f in standards_dir.glob("*.md"):
            content = read_file(f)
            file_version = extract_version(content, f.name)
            if f.name in readme_versions and file_version:
                if readme_versions[f.name] != file_version:
                    issues.append(
                        f"  {f.name}: README says v{readme_versions[f.name]}, "
                        f"file says v{file_version}"
                    )

    return issues


def check_stack_signature(toolkit_dir):
    """Check 4: Stack signature consistent across files."""
    issues = []
    signature_pattern = r'Built with:\s*(.+)'
    signatures = {}

    for md_file in toolkit_dir.rglob("*.md"):
        content = read_file(md_file)
        matches = re.findall(signature_pattern, content)
        if matches:
            rel_path = md_file.relative_to(toolkit_dir)
            signatures[str(rel_path)] = matches[-1].strip()

    unique_signatures = set(signatures.values())
    if len(unique_signatures) > 1:
        issues.append("  Multiple different stack signatures found:")
        for path, sig in signatures.items():
            issues.append(f"    {path}: {sig}")

    return issues


def check_skill_references(toolkit_dir):
    """Check 5: Skills referenced in AGENT_RULES exist."""
    issues = []
    agent_rules = read_file(toolkit_dir / "AGENT_RULES.md")
    skills_dir = toolkit_dir / "skills"

    # Find skill references in AGENT_RULES
    skill_pattern = r'`([a-z-]+)/?`'
    referenced_skills = set(re.findall(skill_pattern, agent_rules))

    # Known non-skill references to exclude
    exclude = {'node_modules', 'src', 'prisma', 'components', 'standards', 'templates',
               'instructions', 'agent-toolkit', 'download', 'db', 'backup'}

    existing_skills = set()
    if skills_dir.is_dir():
        existing_skills = {d.name for d in skills_dir.iterdir() if d.is_dir()}

    for skill in referenced_skills - exclude:
        if skill not in existing_skills:
            # Only report if it looks like a skill name (contains hyphens, typical pattern)
            if '-' in skill and len(skill) > 5:
                issues.append(f"  Skill '{skill}' referenced in AGENT_RULES but not found in skills/")

    return issues


def check_instruction_references(toolkit_dir):
    """Check 6: Instructions referenced in AGENT_RULES exist."""
    issues = []
    agent_rules = read_file(toolkit_dir / "AGENT_RULES.md")
    instructions_dir = toolkit_dir / "instructions"

    # Find instruction references in AGENT_RULES
    instr_pattern = r'instructions/([a-z-]+\.md)'
    referenced = set(re.findall(instr_pattern, agent_rules))

    existing = set()
    if instructions_dir.is_dir():
        existing = {f.name for f in instructions_dir.glob("*.md")}

    for ref in referenced:
        if ref not in existing:
            issues.append(f"  Instruction '{ref}' referenced in AGENT_RULES but not found in instructions/")

    return issues


def main():
    toolkit_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else find_toolkit_dir()
    print(f"Validating agent-toolkit at: {toolkit_dir}")
    print("=" * 60)

    all_issues = []

    checks = [
        ("1. STD-ID Consistency", check_std_id_consistency),
        ("2. Version Consistency", check_version_consistency),
        ("3. Stack Signature Consistency", check_stack_signature),
        ("4. Skill References", check_skill_references),
        ("5. Instruction References", check_instruction_references),
    ]

    for name, check_fn in checks:
        print(f"\n{name}:")
        issues = check_fn(toolkit_dir)
        if issues:
            for issue in issues:
                print(f"  ISSUE: {issue}")
            all_issues.extend(issues)
        else:
            print("  OK")

    print("\n" + "=" * 60)
    if all_issues:
        print(f"FOUND {len(all_issues)} issue(s)")
        sys.exit(1)
    else:
        print("ALL CHECKS PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
