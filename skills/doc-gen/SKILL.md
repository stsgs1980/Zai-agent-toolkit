---
name: doc-gen
version: 1.0
description: >
  Generate professional documents (PDF, DOCX, XLSX) following agent-toolkit standards.
  Enforces No-Unicode Policy in generated content, proper typography, anti-fragile file
  writing, and reproducible output paths (/home/z/my-project/download/). Activate when
  the user needs to create reports, documents, spreadsheets, or any file-based deliverable.
  Also use when user mentions "generate document", "create report", "export to PDF/DOCX/XLSX",
  "write a report", "make a spreadsheet", or any document creation request.
---

# Document Generation Skill

## Why this matters

Document generation in Z.ai sandbox must follow the same standards as code: no Unicode graphics, anti-fragile file operations, and reproducible output paths. Without this skill, agents may generate documents with emoji, save to wrong directories, or produce files that break on different systems.

---

## The 5 Rules

### Rule 1: Output Directory

All generated documents MUST be saved to `/home/z/my-project/download/`:

```python
import os

OUTPUT_DIR = "/home/z/my-project/download"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Always use absolute paths for output
output_path = os.path.join(OUTPUT_DIR, "report.pdf")
```

This is the ONLY allowed output location. Never save to `/tmp/`, `~/`, or project subdirectories.

### Rule 2: No-Unicode Policy in Documents

Generated documents MUST comply with No-Unicode Policy (STD-DOC-003):

| Context | Level | Rule |
|---------|-------|------|
| PDF body text | [C] Critical | ASCII + Cyrillic + typographic characters only |
| DOCX body text | [C] Critical | ASCII + Cyrillic + typographic characters only |
| XLSX cell values | [C] Critical | ASCII + Cyrillic + digits only |
| Charts/tables headers | [C] Critical | Text labels only, no Unicode symbols |
| Document titles | [C] Critical | Plain text, no emoji or decorative symbols |

**Icon substitution:** Use text labels instead of emoji:
- Instead of status emoji: use text tags `[OK]`, `[FAIL]`, `[TODO]`, `[WARN]`
- Instead of bullet emoji: use standard bullet characters or numbered lists
- Instead of decorative emoji: use horizontal rules or section headers

### Rule 3: Typography Standards

For PDF documents using ReportLab:

```python
# Register Chinese fonts for Cyrillic support
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('NotoSansSC', '/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))

# Use registered fonts in styles
from reportlab.lib.styles import ParagraphStyle

body_style = ParagraphStyle(
    'BodyText_Custom',
    fontName='NotoSansSC',
    fontSize=11,
    leading=16,
)
```

**Superscript and subscript:** Use ReportLab tags, NOT Unicode escape sequences:
```python
# CORRECT
Paragraph('H<sub>2</sub>O', style)
Paragraph('10<super>2</super>', style)

# PROHIBITED
Paragraph('H\u2082O', style)
Paragraph('10\u00b2', style)
```

### Rule 4: Anti-Fragile File Writing

Document generation MUST NOT fail silently or corrupt output:

```python
import shutil

def write_document_safely(output_path: str, generate_fn):
    """Anti-fragile document generation with temp file + atomic rename."""
    temp_path = output_path + '.tmp'

    try:
        # Generate to temp file first
        generate_fn(temp_path)

        # Verify the temp file was created and is not empty
        if not os.path.exists(temp_path):
            raise FileNotFoundError(f"Document generation failed: {temp_path} not created")

        file_size = os.path.getsize(temp_path)
        if file_size == 0:
            raise ValueError(f"Document generation failed: {temp_path} is empty")

        # Atomic rename (reliable on same filesystem)
        shutil.move(temp_path, output_path)
        return output_path

    except Exception as e:
        # Clean up temp file on failure
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise RuntimeError(f"Document generation failed: {e}") from e
```

### Rule 5: Language Consistency

Document content MUST match the user's language:

| User Language | Document Language | Notes |
|---------------|-------------------|-------|
| Russian | Russian | All text, headers, labels in Russian |
| English | English | All text, headers, labels in English |
| Mixed | Match primary language | Code/paths always in English |

---

## Document Type Guidelines

### PDF (ReportLab)

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table

def generate_pdf(output_path: str, title: str, content: list):
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()

    # Override body font for Unicode/Cyrillic support
    styles['Normal'].fontName = 'NotoSansSC'

    elements = [
        Paragraph(title, styles['Title']),
        Spacer(1, 12),
    ]

    for item in content:
        elements.append(Paragraph(item, styles['Normal']))

    doc.build(elements)
```

### DOCX (python-docx)

```python
from docx import Document
from docx.shared import Inches, Pt

def generate_docx(output_path: str, title: str, paragraphs: list):
    doc = Document()

    heading = doc.add_heading(title, level=0)
    for run in heading.runs:
        run.font.size = Pt(24)

    for text in paragraphs:
        doc.add_paragraph(text)

    doc.save(output_path)
```

### XLSX (openpyxl)

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

def generate_xlsx(output_path: str, title: str, headers: list, rows: list):
    wb = Workbook()
    ws = wb.active
    ws.title = title

    # Header styling
    header_font = Font(bold=True, size=12)
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font_white = Font(bold=True, size=12, color="FFFFFF")

    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font_white
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    for row_idx, row_data in enumerate(rows, 2):
        for col_idx, value in enumerate(row_data, 1):
            ws.cell(row=row_idx, column=col_idx, value=value)

    wb.save(output_path)
```

---

## Pre-generation Checklist

- [ ] Output path starts with `/home/z/my-project/download/`
- [ ] No emoji or Unicode graphics in document content
- [ ] Superscripts/subscripts use ReportLab tags (not Unicode escapes)
- [ ] Chinese/Cyrillic fonts registered for PDF generation
- [ ] Language matches user's input language
- [ ] Anti-fragile writing pattern used (temp file + rename)
- [ ] File size > 0 after generation (verification)

---

## Integration with Other Skills

- **sanitize-validate**: Use for validating user input before document generation
- **api-retry**: Use if document generation requires API calls (e.g., AI content)
- **health-check**: Verify API availability before AI-powered generation

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
