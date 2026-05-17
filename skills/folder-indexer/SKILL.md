---
name: folder-indexer
id: ZAI-FS-001
version: 1.0
compatibility: both
description: "Create and manage folder indexes for easy navigation. Scans directories and creates _index.json with file descriptions, tags, and categories. Use when you need to organize and search through large collections of files."
trigger: index folder, scan directory, folder index, list files, organize files
---


# Skill: Folder Indexer v1.0


> ID: ZAI-FS-001
> Version: 1.0
> Last Updated: 2026-05

Create searchable indexes for any folder with thousands of files.

## Problem Solved

When you have folders with hundreds or thousands of files, finding the right document becomes painful. This skill creates an index file that lists all files with descriptions and tags.

## Usage

```bash
python ~/.zcode/tools/folder_indexer.py <command> <path> [options]
```

## Commands

| Command | Description |
|---------|-------------|
| scan | Create new index for folder |
| update | Update existing index (preserves descriptions) |
| search | Search in index |
| list | List items in index |

## Examples

### Create Index

```bash
# Scan a folder
python ~/.zcode/tools/folder_indexer.py scan ./documents

# Scan with depth limit
python ~/.zcode/tools/folder_indexer.py scan ./projects --depth 2
```

### Update Index

```bash
# Update after adding new files (preserves your descriptions)
python ~/.zcode/tools/folder_indexer.py update ./documents
```

### Search

```bash
# Search for files
python ~/.zcode/tools/folder_indexer.py search ./documents "contract"
python ~/.zcode/tools/folder_indexer.py search ./projects "api"
```

### List

```bash
# List all items
python ~/.zcode/tools/folder_indexer.py list ./documents

# Filter by category
python ~/.zcode/tools/folder_indexer.py list ./documents --category documents
```

## Output File

Creates `_index.json` in the folder:

```json
{
  "folder": "documents",
  "created": "2026-05-17T15:30:00",
  "total_files": 1247,
  "total_dirs": 23,
  "categories": {
    "documents": 450,
    "spreadsheets": 120,
    "images": 677
  },
  "items": [
    {
      "name": "contract-2024.pdf",
      "type": "file",
      "category": "documents",
      "size": "2.3MB",
      "modified": "2024-01-15",
      "description": "",
      "tags": []
    }
  ]
}
```

## Adding Descriptions

Open `_index.json` and add descriptions:

```json
{
  "name": "contract-2024.pdf",
  "description": "Contract with ABC Corp for Q1 delivery",
  "tags": ["contract", "ABC", "2024"]
}
```

Then run `update` to add new files while keeping your descriptions.

## File Categories

| Category | Extensions |
|----------|------------|
| documents | .pdf, .doc, .docx, .txt, .md |
| spreadsheets | .xls, .xlsx, .csv |
| presentations | .ppt, .pptx |
| images | .jpg, .png, .gif, .svg |
| code | .py, .js, .ts, .java, .go |
| config | .json, .yaml, .toml |
| archives | .zip, .rar, .7z |
| media | .mp3, .mp4, .wav |

## Use Cases

- **Document folders** - Index contracts, invoices, reports
- **Project folders** - Index code, configs, docs
- **Download folders** - Find downloaded files
- **Archive folders** - Navigate old files

## Related Skills

- memory-store (ZAI-MEM-001): Store folder index in memory
- memory-query (ZAI-MEM-002): Search across indexes

---
Built with: Z.ai Agent Toolkit
