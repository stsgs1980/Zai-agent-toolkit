# Standard: Code Examples Guide v1.0 (EN)

> ID: STD-DOC-005
> Version: 1.0
> Level: **[W] Warning**
> Last Updated: 2025-01

---

## Unified Educational Document (Full Version)

**Document Purpose:** Learn to create code examples that:
- Are understandable at first glance
- Copy correctly without extra characters
- Run without modifications
- Are safe for accidental use
- Are accessible to all users (including screen reader users)

---

## Part 1. Basic Formatting Principles

### 1.1. Syntax Highlighting

**What it is:** Different colors for keywords, strings, comments.

**How to specify in Markdown:**
````markdown
```python
def greet(name):
    # This is a comment
    return f"Hello, {name}!"
```
````

**Why important:** Without highlighting, code blends into a gray mass, eyes get tired.

**Limitation:** Do not rely ONLY on color to convey meaning — screen readers do not see colors.

---

### 1.2. Code Formatting

**What it is:** Proper indentation, spaces, line breaks.

**Bad:**
```python
def add(x,y):return x+y
```

**Good:**
```python
def add(x, y):
    return x + y
```

**Tools:** Prettier, Black (Python), gofmt (Go), ESLint (JavaScript).

---

### 1.3. Code Style

**What it is:** Unified rules for the entire project or language.

**Example for Python (PEP 8):**
- 4 spaces for indentation
- Maximum 79 characters per line
- Names: `snake_case` for functions, `CamelCase` for classes

**Bad:**
```python
def CalculateSum( A, B ): return A+B
```

**Good:**
```python
def calculate_sum(a, b):
    return a + b
```

---

## Part 2. Copy and Use Principles

### 2.1. Copy-Paste Ready Example

**What it is:** Code can be copied and pasted without removing extra characters.

**Bad (extra characters present):**
```python
5: def hello():
6:     print("Hi")
```

```bash
$ pip install requests
$ python script.py
```

**Good (clean code):**
```python
def hello():
    print("Hi")
```

```bash
pip install requests
python script.py
```

---

### 2.2. Self-Contained Example

**What it is:** Code works immediately after pasting, does not require external files, network, or database.

**Bad (depends on missing variable):**
```python
result = process(data)  # where is data?
```

**Good (self-contained):**
```python
data = [1, 2, 3, 4, 5]

def process(numbers):
    return [n * 2 for n in numbers]

result = process(data)
print(result)  # [2, 4, 6, 8, 10]
```

---

### 2.3. Idempotent Example

**What it is:** Example can be run many times — result is the same each time.

**Bad (depends on time or counter):**
```python
import time
print(time.time())  # different each time
```

**Good (predictable result):**
```python
print(2 + 2)  # always 4
```

---

### 2.4. Executable / Testable Example

**What it is:** Code from documentation is automatically checked during build.

**Python doctest example:**
```python
def multiply(a, b):
    """
    >>> multiply(3, 4)
    12
    """
    return a * b
```

**Why cool:** Example never becomes outdated — test will fail when code changes.

---

## Part 3. Showing Changes and Output

### 3.1. Diff / Patch — Showing Changes

**When needed:** Explaining what changed between two versions.

**How to format:**
```diff
def calculate(x):
-    return x * 2  # old formula
+    return x ** 2  # new formula
```

Green (`+`) — added, red (`-`) — removed.

---

### 3.2. Code Blocks with Output (REPL-style)

**When needed:** Show not only code but also its result.

**Example:**
```python
>>> squares = [x**2 for x in range(5)]
>>> squares
[0, 1, 4, 9, 16]
```

**Important for copying:** User should copy only lines **without `>>>`**! Better to provide code and output separately:

````markdown
**Code:**
```python
squares = [x**2 for x in range(5)]
print(squares)
```

**Output:**
```
[0, 1, 4, 9, 16]
```
````

---

## Part 4. Annotations and Explanations

### 4.1. Comments and Arrows (Decorating Code)

**When needed:** Explain a specific place in a long example.

**Good (with comments):**
```python
def process(user_data):
    # Check for empty dictionary
    if not user_data:
        return None

    # Extract name
    name = user_data.get("name", "Anonymous")
    return name.upper()
```

---

### 4.2. Accessibility

**Problem:** Not all users see colors or use screen readers.

**Rules:**
1. Do not rely ONLY on color to convey meaning
2. Add text comments
3. Use explicit indicators (`# IMPORTANT:`, `WARNING:`)

**Bad (color only):**
```python
# (red text) change this line
api_key = "key"
```

**Good (text explanation):**
```python
# CHANGE THIS LINE:
api_key = "your-key-here"
```

---

## Part 5. Minimization and Cleanliness

### 5.1. Minimal Reproduction

**Principle:** Example should be **minimal** but **sufficient**.

**Bad (too much extra):**
```python
import sys
import json
import datetime
from collections import defaultdict

x = 42  # this variable not needed for example

def main():
    print("Hello")
    # ... 50 lines of code ...
```

**Good (essence only):**
```python
numbers = [1, 2, 3]
result = sum(numbers)
print(result)  # 6
```

---

### 5.2. Case Sensitivity

**Problem:** Many languages (Python, Java, C, Go) are case-sensitive.

**Bad (wrong case):**
```python
Print("Hello")   # NameError: name 'Print' is not defined
```

**Good:**
```python
print("Hello")
```

---

## Part 6. Multilingual and Versioning

### 6.1. Polyglot Examples

When you need to show **the same algorithm** in multiple languages:

````markdown
```python
print("Hello, world!")
```

```javascript
console.log("Hello, world!");
```

```bash
echo "Hello, world!"
```
````

**Rule:** Specify language for each block, even if repeated.

---

### 6.2. Versioning (language / library versions)

Example may work in Python 3.11 but not in 3.7.

**Rule:** Specify minimum version.

````markdown
```python
# Requires: Python 3.10+
match value:
    case 1:
        print("One")
```
````

---

## Part 7. Folding and Security

### 7.1. Collapsible Long Code

When example is long but not all is needed for understanding:

````markdown
<details>
<summary>Full server code (click to expand)</summary>

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello"

if __name__ == '__main__':
    app.run()
```
</details>
````

**Principle:** Can be copied, but long code does not distract.

---

### 7.2. Example Security

**Problem:** User might copy and run dangerous code.

**Good (danger warning):**
```bash
# WARNING: This will delete the temp folder!
rm -rf ./temp_folder
```

```sql
-- DANGEROUS in production: deletes all data
-- DROP DATABASE production;
-- Use safe example instead:
DROP DATABASE IF EXISTS test_db;
```

**Rules:**
- Mark dangerous commands
- Use placeholders (test, example)
- For destructive operations, show them commented out

---

## Part 8. Advanced Techniques

### 8.1. Live / Interactive Code

**What it is:** Code that can be run directly in the browser.

**Formats:**
- **MDX** (React in Markdown)
- **CodePen / JSFiddle** (iframe embedding)
- **Jupyter Notebooks** (`.ipynb`)

**Where useful:** Learning platforms, UI library documentation.

---

### 8.2. Auto-generating Examples from Real Code (Single source of truth)

In professional documentation, code in Markdown is **not written by hand**, but **imported** from the repository.

**Docusaurus (React):**
```jsx
import CodeBlock from '@theme/CodeBlock';

<CodeBlock language="jsx" title="/src/App.js">
  {require('!!raw-loader!../examples/App.js').default}
</CodeBlock>
```

**Sphinx (Python):**
```rst
.. literalinclude:: ../examples/quick_start.py
   :language: python
   :lines: 10-20
```

**Why important:** Example never becomes outdated because it is real working code from the project.

---

### 8.3. License and Attribution (legal aspect)

When you take someone else's code for an educational document:

**Rules:**
1. Specify **source** (author, license)
2. Some licenses **prohibit** or limit copying without copyright

**Example formatting:**
```markdown
> Example from [Requests](https://docs.python-requests.org/) documentation, Apache 2.0 license

```python
import requests
response = requests.get('https://api.github.com')
```
```

---

## Part 9. Tool Markup

### 9.1. Copy Button Attributes

On websites there is often a "Copy" button. For it to work correctly:

```html
<pre><code class="language-python" data-copyable>print("Hello")</code></pre>
```

In Markdown this is not always supported, but the principle: **code block should be clean** (no line numbers, no `>>>`, no arrows).

---

## Part 10. Anti-patterns (what NOT to do)

| Do Not | Do This Instead |
|--------|-----------------|
| `5: def hello():` | `def hello():` |
| `>>> print("Hi")` | `print("Hi")` |
| `$ pip install x` | `pip install x` |
| `result = process(data)  # where is data?` | All code self-contained |
| `# (red text)` | `# CHANGE THIS LINE:` |
| `Print("Hello")` | `print("Hello")` |
| `rm -rf /` without warning | `# WARNING: DO NOT RUN: rm -rf /` |

---

## Practical Exercise

Format the following example correctly:

**Original (bad):**
```
$ python
>>> def foo(x,y):
...     return x+y
...
>>> foo(5,3)
8
```

**Requirements:**
1. Remove shell prompts (`$`, `>>>`, `...`)
2. Add syntax language
3. Make example self-contained
4. Add comments
5. Show code and output separately

**Expected answer:**

````markdown
```python
def add(x, y):
    """Returns the sum of two numbers."""
    return x + y

# Usage example
result = add(5, 3)
print(result)  # 8
```

**Output:**
```
8
```
````

---

## Cheat Sheet (Markdown Reference)

| Task | Syntax |
|------|--------|
| Regular code block | `` `code` `` (inline) or ```` ``` ```` (block) |
| Specify language | ```` ```python ```` |
| Diff changes | ```` ```diff ```` |
| No highlighting | ```` ```text ```` |
| Collapsible block | `<details><summary>...</summary>```code```</details>` |
| Warning | `WARNING:` or `> **WARNING:**` |

---

## Summary: Checklist for Good Code Example

- [ ] Syntax highlighting present (language specified)
- [ ] Indentation and line breaks correct
- [ ] No extra characters (`$`, `>>>`, line numbers, arrows inside)
- [ ] Example is self-contained
- [ ] No unnecessary imports and variables
- [ ] Clear comments present (not just color)
- [ ] Expected result shown (separate from code)
- [ ] Language/library version specified (if important)
- [ ] Dangerous commands marked with warning
- [ ] (Optional) Example is automatically tested
- [ ] (If borrowed code) License and source specified

---

## Glossary (Quick Term Reference)

| Term | Meaning |
|------|---------|
| **Copy-paste ready** | Code copies without removing extra characters |
| **Self-contained** | Does not require external files or network |
| **Idempotent** | Repeated run gives same result |
| **Isolated** | Does not depend on global state |
| **Minimal reproduction** | Shortest example that shows the problem |
| **Polyglot** | Same algorithm in multiple languages |
| **REPL** | Read-Eval-Print Loop (with `>>>`) |
| **Diff** | Showing changes (`+`/`-`) |
| **Single source of truth** | Code generated from real file |

---

**This document can be used as:**
- Introduction for beginners
- Cheat sheet for the team
- Code example formatting standard in your project
- Checklist for documentation code review

**File is fully ready to use.** Save as `code-examples-guide.md`.
