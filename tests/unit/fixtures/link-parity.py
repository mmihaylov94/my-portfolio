"""Writes link-parity.json: what portfolio-ai's link grammar finds in each sample.

The chat UI's answer renderer (app/utils/chat/answerText.ts) ports the pattern
portfolio-ai's link filter uses, `_LINK` in src/portfolio_ai/assistant/postprocess.py,
so that nothing becomes a link in the browser that the filter never looked at.
tests/unit/linkParity.test.ts checks the port against the JSON this writes, beside
itself. Regenerate it whenever `_LINK` or portfolio-ai's samples change, from the
root of a portfolio-ai checkout (github.com/mmihaylov94/portfolio-ai), with PORTFOLIO
standing for the path to this repository:

    uv run python PORTFOLIO/tests/unit/fixtures/link-parity.py

The samples are portfolio-ai's own streaming-filter samples, plus a few aimed at
where Python's regular expressions and JavaScript's differ. The special characters
are written with chr() so that none of them is invisible in this file.
"""

import importlib.util
import json
import re
from pathlib import Path

from portfolio_ai.assistant import postprocess

# The samples live in portfolio-ai's unit tests; loaded by path, since the working
# directory is not on sys.path when a script runs.
_spec = importlib.util.spec_from_file_location(
    "test_postprocess", Path.cwd() / "tests" / "unit" / "test_postprocess.py"
)
assert _spec is not None and _spec.loader is not None
_tests = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_tests)

GRIN = chr(0x1F600)  # outside the Basic Multilingual Plane: two UTF-16 code units

EXTRA = [
    # Python's \s includes the separators U+001C to U+001F and U+0085; JavaScript's does not.
    "Separated" + chr(0x1C) + "https://mihaylov.io/#about" + chr(0x1D) + "end",
    "Next line" + chr(0x85) + "https://mihaylov.io/" + chr(0x85) + "more",
    # JavaScript's \s includes U+FEFF; Python's does not.
    "Marked" + chr(0xFEFF) + "https://mihaylov.io/#contact" + chr(0xFEFF) + "tail",
    # Ideographic space ends a URL in both.
    "Wide" + chr(0x3000) + "https://mihaylov.io/#projects" + chr(0x3000) + "gap",
    # Ignoring case, Python lets the long s stand for "s".
    "Long s: http" + chr(0x17F) + "://mihaylov.io/x and HTTP" + chr(0x17F) + "://mihaylov.io/y",
    # The length limits count code points, not UTF-16 code units: a label of 300
    # of these is 600 code units long, and must still match.
    "[" + GRIN * 300 + "](https://mihaylov.io/#about)",
    "[" + GRIN * 301 + "](https://mihaylov.io/#about)",
    # Schemes the renderer must never link, written as the grammar sees them.
    "[click](javascript:alert(1)) and [mail](mailto:someone@example.com) and <www.example.com>.",
]


def _match(found: re.Match[str]) -> dict[str, str | None]:
    url = found.group("url")
    return {
        "match": found.group(0),
        "label": found.group("label"),
        "target": found.group("target"),
        "title": found.group("title"),
        "url": url,
        # What the filter treats as the link itself; see postprocess.urls_in.
        "stripped": None
        if url is None
        else url.strip("<>").rstrip(postprocess._TRAILING_PUNCTUATION + postprocess._EMPHASIS),
    }


samples = [
    {"text": text, "matches": [_match(m) for m in postprocess._LINK.finditer(text)]}
    for text in [*_tests.SAMPLES, *EXTRA]
]

# Written here rather than printed for the shell to save: the bytes that reach the
# file are then this script's choice, not the shell's. Windows PowerShell 5.1's ">"
# saves UTF-16, which no JSON reader expects, and print() on Windows ends lines with
# CRLF. ensure_ascii keeps every character in the file visible, as a \u escape.
output = Path(__file__).with_suffix(".json")
output.write_text(
    json.dumps({"samples": samples}, ensure_ascii=True, indent=1) + "\n",
    encoding="utf-8",
    newline="\n",
)
print(f"Wrote {len(samples)} samples to {output}")
