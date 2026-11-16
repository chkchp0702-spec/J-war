#!/usr/bin/env python3
"""VER(js/01-data.js)에 맞춰 version.json 과 index.html 의 ?v= 를 고침."""
import re, json, pathlib
root = pathlib.Path(__file__).parent
ver = int(re.search(r"const VER\s*=\s*(\d+)", (root / "js/01-data.js").read_text(encoding="utf-8")).group(1))
(root / "version.json").write_text(json.dumps({"v": ver}) + "\n", encoding="utf-8")
html = (root / "index.html").read_text(encoding="utf-8")
html = re.sub(r"(js/[\w-]+\.js)\?v=\d+", lambda m: f"{m.group(1)}?v={ver}", html)
(root / "index.html").write_text(html, encoding="utf-8")
print("version", ver)
