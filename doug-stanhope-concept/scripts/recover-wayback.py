#!/usr/bin/env python3
"""Download key pages of dougstanhope.com from the Wayback Machine.

Writes a static copy under archive/. Safe to re-run. Prints what it saved
and what it could not.
"""

from __future__ import annotations

import gzip
import html
import json
import posixpath
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "archive"
UA = "StanhopeSiteHandoff/1.0 (static archive recovery for the site owner)"
MAX_ASSET = 180_000
MAX_TOTAL = 5_000_000
SKIP_EXT = {
    ".mp3", ".mp4", ".m4a", ".wav", ".avi", ".mov", ".flv", ".swf",
    ".wmv", ".mpg", ".mpeg", ".ogg", ".webm", ".zip", ".pdf", ".exe",
}
PAGES_2014 = [
    "/", "/tour-dates/", "/bio/", "/mypodcast/", "/store/", "/journal/",
    "/past-gigs/", "/archives/", "/business-contact/", "/to-reach-doug/",
    "/stand-up/", "/tv/", "/internet/", "/guest/",
]


def sleep(seconds):
    time.sleep(seconds)


def fetch(url, attempts=5):
    delay = 12
    last = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Accept-Encoding": "identity",
            })
            with urllib.request.urlopen(request, timeout=60) as response:
                data = response.read()
                status = response.status
                ctype = response.headers.get("Content-Type", "")
            if data[:2] == b"\x1f\x8b":
                data = gzip.decompress(data)
            sleep(1.3)
            return status, ctype, data
        except urllib.error.HTTPError as error:
            last = error
            if error.code in (429, 502, 503, 504) and attempt + 1 < attempts:
                print(f"  backoff {error.code} {url[:90]}", flush=True)
                sleep(delay)
                delay *= 2
                continue
            raise
        except Exception as error:
            last = error
            if attempt + 1 < attempts:
                print(f"  retry {type(error).__name__} {url[:90]}", flush=True)
                sleep(delay)
                delay *= 2
                continue
            raise
    raise last


def cdx(url, start, end, collapse=None):
    query = urllib.parse.urlencode({
        "url": url,
        "output": "json",
        "fl": "timestamp,original,statuscode,mimetype,length",
        "filter": "statuscode:200",
        "from": start,
        "to": end,
        "limit": "80",
    }, safe="*")
    # filter must be repeated for mimetype; urlencode keeps one.
    full = "https://web.archive.org/cdx/search/cdx?" + query + "&filter=mimetype:text/html"
    if collapse:
        full += "&collapse=" + urllib.parse.quote(collapse)
    _status, _ctype, data = fetch(full)
    rows = json.loads(data.decode("utf-8", "replace"))
    return rows[1:] if rows else []


def cdx_any(url, start, end):
    query = urllib.parse.urlencode({
        "url": url,
        "output": "json",
        "fl": "timestamp,original,statuscode,mimetype,length",
        "filter": "statuscode:200",
        "from": start,
        "to": end,
        "limit": "20",
    })
    full = "https://web.archive.org/cdx/search/cdx?" + query
    _status, _ctype, data = fetch(full)
    rows = json.loads(data.decode("utf-8", "replace"))
    return rows[1:] if rows else []


def classify(sample):
    low = sample.decode("latin-1", "replace").lower()
    if "squarespace-damask" in low or "this is squarespace" in low:
        return "ss7"
    if "modulepage" in low:
        return "ss5"
    return "custom"


def closest(rows, anchor):
    best = None
    best_gap = None
    for row in rows:
        timestamp = row[0]
        if not timestamp.isdigit():
            continue
        gap = abs(int(timestamp) - int(anchor))
        if best is None or gap < best_gap:
            best = row
            best_gap = gap
    return best


def captured_label(timestamp):
    date = datetime.strptime(timestamp[:8], "%Y%m%d")
    return f"{date.day} {date.strftime('%B %Y')}"


def host_ok(netloc):
    host = netloc.lower().split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    return host == "dougstanhope.com"


def unwrap(raw):
    text = html.unescape(raw.strip())
    match = re.search(r"web\.archive\.org/web/\d+(?:id_)?/(https?:.*)$", text, re.I)
    if match:
        return match.group(1)
    match = re.match(r"^/web/\d+(?:id_)?/(https?:.*)$", text, re.I)
    if match:
        return match.group(1)
    return text


def normalize_path(path):
    path = urllib.parse.unquote(path or "/")
    path = path.split("?")[0]
    if not path.startswith("/"):
        path = "/" + path
    parts = []
    for part in path.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part)
    if not parts:
        return "/"
    trailing = path.endswith("/")
    joined = "/" + "/".join(parts)
    if trailing and not joined.endswith("/"):
        joined += "/"
    return joined


def local_name(path, html_page):
    path = normalize_path(path)
    if path == "/":
        return "index.html"
    relative = path.lstrip("/")
    if html_page:
        if relative.endswith(".php"):
            relative = relative[:-4] + ".html"
        elif relative.endswith("/"):
            relative += "index.html"
        elif "." not in relative.split("/")[-1]:
            relative += "/index.html"
    return relative


def is_html_path(path):
    lower = path.lower()
    if lower.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".css", ".js")):
        return False
    return True


def id_url(timestamp, original):
    if not original.startswith("http"):
        original = "http://" + original
    return f"https://web.archive.org/web/{timestamp}id_/{original}"


def boot_script():
    text = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r"<script id=\"theme-boot\">[\s\S]*?</script>", text)
    if not match:
        raise SystemExit("theme boot script is missing from index.html")
    return match.group(0)


def rel_link(from_rel, to_rel):
    start = posixpath.dirname(from_rel)
    return posixpath.relpath(to_rel, start or ".")


class Era:
    def __init__(self, folder, kind, description, anchor, start, end):
        self.folder = folder
        self.kind = kind
        self.description = description
        self.anchor = anchor
        self.start = start
        self.end = end
        self.pages = []
        self.skipped = []
        self.failures = []
        self.saved = {}
        self.original_of = {}
        self.total = 0


def pick_page(era, path):
    url = "www.dougstanhope.com" + ("" if path == "/" else path)
    try:
        rows = cdx(url, era.start, era.end)
    except Exception as error:
        era.failures.append({"url": url, "reason": f"CDX {type(error).__name__}: {error}"})
        print(f"  cdx fail {url}: {error}", flush=True)
        return None
    row = closest(rows, era.anchor)
    if not row:
        era.failures.append({"url": url, "reason": "No text/html capture in the chosen window."})
        print(f"  no capture {url}", flush=True)
        return None
    timestamp, original = row[0], row[1]
    try:
        _status, ctype, data = fetch(id_url(timestamp, original))
    except Exception as error:
        era.failures.append({"url": original, "reason": f"Download {type(error).__name__}: {error}"})
        print(f"  download fail {original}: {error}", flush=True)
        return None
    if b"<html" not in data.lower() and b"<!doctype" not in data.lower():
        era.failures.append({"url": original, "reason": f"Not an HTML page ({ctype})."})
        return None
    key = normalize_path(urllib.parse.urlparse(original).path or path)
    name = local_name(key, True)
    era.saved[key] = name
    if key.endswith("/") and key != "/":
        era.saved[key.rstrip("/")] = name
    elif not key.endswith(".php") and "." not in key.split("/")[-1]:
        era.saved[key + "/"] = name
    if key.endswith(".php"):
        era.saved[key[:-4] + ".html"] = name
    era.original_of[name] = original if original.startswith("http") else "http://" + original
    era.pages.append({
        "file": f"archive/{era.folder}/{name}",
        "original": era.original_of[name],
        "timestamp": timestamp,
        "captured": captured_label(timestamp),
        "bytes": len(data),
    })
    era.total += len(data)
    target = ARCHIVE / era.folder / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(f"  page {timestamp} {key} -> {name} ({len(data)} bytes)", flush=True)
    return data


def asset_candidates(data, base_original):
    text = data.decode("latin-1", "replace")
    found = []
    for match in re.finditer(r'''(?:href|src)\s*=\s*(["'])(.*?)\1''', text, re.I | re.S):
        found.append(match.group(2))
    for match in re.finditer(r'''url\(\s*(["']?)(.*?)\1\s*\)''', text, re.I):
        found.append(match.group(2))
    urls = []
    for raw in found:
        absolute = resolve_internal(base_original, raw)
        if absolute:
            urls.append(absolute)
    return urls


def resolve_internal(base_original, raw):
    text = unwrap(raw)
    if not text or text.startswith(("#", "mailto:", "javascript:", "data:", "tel:")):
        return None
    absolute = urllib.parse.urljoin(base_original, text)
    parsed = urllib.parse.urlparse(absolute)
    if not host_ok(parsed.netloc):
        return None
    path = normalize_path(parsed.path)
    ext = posixpath.splitext(path)[1].lower()
    if ext not in {".css", ".js", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico"}:
        return None
    return urllib.parse.urlunparse(("http", "www.dougstanhope.com", path, "", parsed.query, ""))


def save_assets(era):
    seen = set()
    images = 0
    for page in list(era.pages):
        name = page["file"].split(f"archive/{era.folder}/", 1)[1]
        data = (ARCHIVE / era.folder / name).read_bytes()
        for absolute in asset_candidates(data, page["original"]):
            parsed = urllib.parse.urlparse(absolute)
            path = normalize_path(parsed.path)
            if path in seen or path in era.saved:
                continue
            seen.add(path)
            ext = posixpath.splitext(path)[1].lower()
            if ext in SKIP_EXT:
                era.skipped.append({"url": absolute, "reason": "Media type left out."})
                continue
            if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"} and images >= 40:
                era.skipped.append({"url": absolute, "reason": "Image cap reached (40 per copy)."})
                continue
            if era.total >= MAX_TOTAL:
                era.skipped.append({"url": absolute, "reason": "Size cap reached."})
                continue
            try:
                rows = cdx_any("www.dougstanhope.com" + path, era.start, era.end)
            except Exception as error:
                era.failures.append({"url": absolute, "reason": f"CDX {type(error).__name__}"})
                continue
            row = closest(rows, era.anchor)
            if not row:
                era.skipped.append({"url": absolute, "reason": "No capture in the chosen window."})
                continue
            length = int(row[4] or 0)
            if length > MAX_ASSET:
                era.skipped.append({"url": absolute, "reason": f"Larger than {MAX_ASSET} bytes ({length})."})
                continue
            try:
                _status, _ctype, body = fetch(id_url(row[0], row[1]))
            except Exception as error:
                era.failures.append({"url": absolute, "reason": f"Download {type(error).__name__}"})
                continue
            if len(body) > MAX_ASSET:
                era.skipped.append({"url": absolute, "reason": f"Downloaded file was {len(body)} bytes."})
                continue
            local = local_name(path, False)
            target = ARCHIVE / era.folder / local
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
            era.saved[path] = local
            era.original_of[local] = absolute
            era.total += len(body)
            if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
                images += 1
            print(f"  asset {path} ({len(body)} bytes)", flush=True)


def lookup(era, path):
    path = normalize_path(path)
    if path in era.saved:
        return era.saved[path]
    if path.endswith(".php") and path[:-4] + ".html" in era.saved:
        return era.saved[path[:-4] + ".html"]
    if not path.endswith("/") and path + "/" in era.saved:
        return era.saved[path + "/"]
    if path.endswith("/") and path.rstrip("/") in era.saved:
        return era.saved[path.rstrip("/")]
    return None


def map_url(era, base_original, from_rel, raw):
    text = unwrap(raw)
    if not text or text.startswith(("#", "mailto:", "javascript:", "data:", "tel:")):
        return None
    absolute = urllib.parse.urljoin(base_original, text)
    parsed = urllib.parse.urlparse(absolute)
    if not host_ok(parsed.netloc):
        return absolute
    path = normalize_path(parsed.path)
    local = lookup(era, path)
    if local:
        return rel_link(from_rel, local)
    if is_html_path(path):
        return rel_link(from_rel, "not-included.html")
    # Missing image or script stays inside this copy and simply does not load.
    return rel_link(from_rel, f"{era.folder}/{local_name(path, False)}")


def rewrite_text(era, from_rel, text, base_original, css=False):
    def attr_sub(match):
        prefix, quote, raw = match.group(1), match.group(2), match.group(3)
        mapped = map_url(era, base_original, from_rel, raw)
        if mapped is None:
            return match.group(0)
        return f"{prefix}{quote}{html.escape(mapped, quote=True)}{quote}"

    def css_sub(match):
        quote, raw = match.group(1), match.group(2)
        mapped = map_url(era, base_original, from_rel, raw)
        if mapped is None:
            return match.group(0)
        return f"url({quote}{mapped}{quote})"

    if css:
        return re.sub(r'''url\(\s*(["']?)(.*?)\1\s*\)''', css_sub, text, flags=re.I)
    text = re.sub(r'''(\b(?:href|src|action)\s*=\s*)(["'])(.*?)\2''', attr_sub, text, flags=re.I | re.S)
    return text


def inject(era, from_rel, text, page):
    boot = boot_script()
    css = rel_link(from_rel, "banner.css")
    index = rel_link(from_rel, "index.html")
    wayback = "https://web.archive.org/web/" + page["timestamp"] + "/" + page["original"]
    banner = (
        '<div class="site-archive-banner" role="note"><p>Archived copy of dougstanhope.com, captured '
        + html.escape(page["captured"])
        + '. <a href="' + html.escape(wayback, quote=True) + '">Wayback capture</a>. '
        + '<a href="' + html.escape(index, quote=True) + '">All recovered pages</a>. '
        + '<button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false">'
        + '<span class="theme-day">Day</span> / <span class="theme-night">Night</span>'
        + '<span class="theme-state">Day theme on. Switch to night.</span></button></p></div>'
    )
    extra = boot + '<meta name="robots" content="noindex"><link rel="stylesheet" href="' + html.escape(css, quote=True) + '">'
    if re.search(r"<head[^>]*>", text, re.I):
        text = re.sub(r"(<head[^>]*>)", r"\1" + extra, text, count=1, flags=re.I)
    else:
        text = extra + text
    if re.search(r"<body[^>]*>", text, re.I):
        text = re.sub(r"(<body[^>]*>)", r"\1" + banner, text, count=1, flags=re.I)
    else:
        text = banner + text
    text = re.sub(r"<base\b[^>]*>", "", text, flags=re.I)
    return text


def finish_pages(era):
    for page in era.pages:
        name = page["file"].split(f"archive/{era.folder}/", 1)[1]
        path = ARCHIVE / era.folder / name
        text = path.read_bytes().decode("latin-1")
        text = rewrite_text(era, f"{era.folder}/{name}", text, page["original"], css=False)
        # rewrite_text uses from_rel relative to archive/, and lookup returns names relative to the era folder.
        # Fix: local names are era-relative, rel_link expects both relative to the same root.
        path.write_text(text, encoding="latin-1")
    # CSS assets
    for local, original in list(era.original_of.items()):
        if not local.endswith(".css"):
            continue
        path = ARCHIVE / era.folder / local
        if not path.exists():
            continue
        text = path.read_bytes().decode("latin-1", "replace")
        text = rewrite_text(era, f"{era.folder}/{local}", text, original, css=True)
        path.write_text(text, encoding="latin-1")
    for page in era.pages:
        name = page["file"].split(f"archive/{era.folder}/", 1)[1]
        path = ARCHIVE / era.folder / name
        text = path.read_text(encoding="latin-1")
        path.write_text(inject(era, f"{era.folder}/{name}", text, page), encoding="latin-1")


def discover_boundary():
    print("Classifying 2010–2011 homepages", flush=True)
    rows = cdx("www.dougstanhope.com/", "20100101", "20110301", collapse="timestamp:6")
    # collapse roughly by taking one per month from the full list
    monthly = {}
    for row in rows:
        monthly.setdefault(row[0][:6], row)
    last_custom = None
    first_squarespace = None
    for key in sorted(monthly):
        row = monthly[key]
        try:
            _status, _ctype, data = fetch(id_url(row[0], row[1]))
        except Exception as error:
            print(f"  classify fail {row[0]}: {error}", flush=True)
            continue
        kind = classify(data[:20000])
        print(f"  {row[0]} {kind}", flush=True)
        if kind == "custom":
            last_custom = row
        elif first_squarespace is None:
            first_squarespace = row
            break
    return last_custom, first_squarespace


def discover_redesign():
    print("Classifying 2014 homepages", flush=True)
    rows = cdx("www.dougstanhope.com/", "20140101", "20141231", collapse="timestamp:6")
    monthly = {}
    for row in rows:
        monthly.setdefault(row[0][:6], row)
    last_ss5 = None
    for key in sorted(monthly):
        row = monthly[key]
        try:
            _status, _ctype, data = fetch(id_url(row[0], row[1]))
        except Exception as error:
            print(f"  classify fail {row[0]}: {error}", flush=True)
            continue
        kind = classify(data[:20000])
        print(f"  {row[0]} {kind}", flush=True)
        if kind == "ss5":
            last_ss5 = row
        elif kind == "ss7" and last_ss5:
            break
    return last_ss5


def custom_paths(data, base):
    text = data.decode("latin-1", "replace")
    found = []
    for match in re.finditer(r'''href\s*=\s*(["'])(.*?)\1''', text, re.I | re.S):
        raw = unwrap(match.group(2))
        if not raw or raw.startswith(("#", "mailto:", "javascript:")):
            continue
        absolute = urllib.parse.urljoin(base, raw)
        parsed = urllib.parse.urlparse(absolute)
        if not host_ok(parsed.netloc):
            continue
        path = normalize_path(parsed.path)
        if ";" in path or "printerfriendly" in path.lower():
            continue
        if not is_html_path(path):
            continue
        if path not in found:
            found.append(path)
    return found[:16]


def write_catalog(manifest, boot):
    def items(era):
        lines = []
        for page in era["pages"]:
            href = page["file"][len("archive/"):]
            lines.append(
                f'<li><a href="{html.escape(href, quote=True)}">{html.escape(page["captured"])}</a> '
                f'{html.escape(page["original"])}</li>'
            )
        return "\n".join(lines) or "<li>No pages were saved for this copy.</li>"

    sections = []
    for era in manifest["eras"]:
        failed = "".join(
            f"<li>{html.escape(item['url'])}: {html.escape(item['reason'])}</li>"
            for item in era["failures"][:12]
        )
        skipped = "".join(
            f"<li>{html.escape(item['url'])}: {html.escape(item['reason'])}</li>"
            for item in era["skipped"][:12]
        )
        extra = ""
        if failed:
            extra += "<h3>Not recovered</h3><ul>" + failed + "</ul>"
        if skipped:
            extra += "<h3>Left out</h3><ul>" + skipped + "</ul>"
            if len(era["skipped"]) > 12:
                extra += f"<p>{len(era['skipped'])} files were left out. The full list is in manifest.json.</p>"
        sections.append(
            f"<h2>{html.escape(era['title'])}</h2><p>{html.escape(era['description'])}</p><ul>{items(era)}</ul>{extra}"
        )
    page = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {boot}
  <meta name="robots" content="noindex">
  <title>Archived copies — Doug Stanhope</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <header>
    <div class="wrap bar">
      <p><a href="../#archive">Back to the site</a></p>
      <button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false"><span class="theme-day">Day</span> / <span class="theme-night">Night</span><span class="theme-state">Day theme on. Switch to night.</span></button>
    </div>
  </header>
  <main class="wrap">
    <h1>Archived copies</h1>
    <p>These are pages saved from the Internet Archive. They are not the current site. Each page names its capture date and links to the Wayback capture it came from.</p>
    {''.join(sections)}
  </main>
</body>
</html>
"""
    (ARCHIVE / "index.html").write_text(page, encoding="utf-8")
    missing = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {boot}
  <meta name="robots" content="noindex">
  <title>Page not in the archive — Doug Stanhope</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <main class="wrap">
    <h1>This page was not included</h1>
    <p>The recovered copy keeps the main sections only. Large media and the rest of the old site were not saved.</p>
    <p><a href="index.html">All recovered pages</a></p>
  </main>
</body>
</html>
"""
    (ARCHIVE / "not-included.html").write_text(missing, encoding="utf-8")


def write_doc(manifest):
    lines = [
        "# Old site archive",
        "",
        "Two older copies of dougstanhope.com were saved from the Internet Archive into `archive/`. They are static files. A page that was not saved links to `archive/not-included.html` instead of the live site.",
        "",
        "Each saved page has a banner with the capture date, a link to the Wayback capture, and the Day / Night control. The banner colors follow the same palette as the front page.",
        "",
        "Large audio, video, Flash, and files over 180 KB were left out. The lists below say what was saved and what was not.",
        "",
    ]
    for era in manifest["eras"]:
        lines.append(f"## {era['title']}")
        lines.append("")
        lines.append(era["description"])
        lines.append("")
        if not era["pages"]:
            lines.append("No pages were saved for this copy.")
            lines.append("")
        else:
            lines.append("| Page | Captured | Wayback |")
            lines.append("| --- | --- | --- |")
            for page in era["pages"]:
                wayback = "https://web.archive.org/web/" + page["timestamp"] + "/" + page["original"]
                lines.append(f"| `{page['file']}` | {page['captured']} | {wayback} |")
            lines.append("")
        if era["failures"]:
            lines.append("Not recovered:")
            lines.append("")
            for item in era["failures"]:
                lines.append(f"- {item['url']}: {item['reason']}")
            lines.append("")
        if era["skipped"]:
            lines.append(f"Left out: {len(era['skipped'])} file(s). Reasons are in `archive/manifest.json`.")
            lines.append("")
    (ROOT / "docs" / "OLD-SITE.md").write_text("\n".join(lines), encoding="utf-8")


def era_dict(era, title):
    return {
        "id": era.folder,
        "kind": era.kind,
        "title": title,
        "description": era.description,
        "anchor": era.anchor,
        "pages": era.pages,
        "skipped": era.skipped,
        "failures": era.failures,
    }


def main():
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    # Classified on 12 November 2026. April 2010 was still the custom site.
    # 1 May 2010 was Squarespace (modulePage). November 2014 was the previous
    # Squarespace design. 17 December 2014 had moved to the later one.
    last_custom = ["20100410005005", "http://www.dougstanhope.com/"]
    last_ss5 = ["20141119173529", "http://www.dougstanhope.com/"]
    print("Using classified anchors", last_custom[0], last_ss5[0], flush=True)

    custom_end = last_custom[0][:8] if last_custom else "20100430"
    custom = None
    if last_custom:
        anchor = last_custom[0]
        custom = Era(
            "2010",
            "pre-squarespace",
            f"The newest homepage classified as the custom site, before Squarespace, was captured on {captured_label(anchor)}.",
            anchor,
            "20090601",
            custom_end,
        )
        print(f"Pre-Squarespace anchor {anchor}", flush=True)
        home = pick_page(custom, "/")
        paths = custom_paths(home, custom.pages[0]["original"]) if home else []
        for path in paths:
            if path in ("/", ""):
                continue
            pick_page(custom, path)
        save_assets(custom)

    redesign = Era(
        "2014",
        "pre-redesign",
        f"The newest homepage still on the previous Squarespace design was captured on {captured_label(last_ss5[0])}. The next checked month had moved to the later Squarespace design.",
        last_ss5[0],
        "20140601",
        last_ss5[0][:8],
    )
    print(f"Pre-redesign anchor {last_ss5[0]}", flush=True)
    for path in PAGES_2014:
        pick_page(redesign, path)
    save_assets(redesign)

    # Correct relative links: saved values are era-folder relative, and from_rel includes the era folder.
    # Adjust lookup results inside map_url by prefixing the era folder. See patched map below.
    for era in (custom, redesign):
        if era and era.pages:
            # Prefix saved targets so rel_link is from archive-root paths.
            era.saved = {key: f"{era.folder}/{value}" for key, value in era.saved.items()}
            finish_pages(era)

    eras = []
    if custom:
        eras.append(era_dict(custom, "Custom site, before Squarespace"))
    eras.append(era_dict(redesign, "Previous design, before the later Squarespace redesign"))
    manifest = {"recoveredAt": "2026-11-12", "eras": eras}
    (ARCHIVE / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    write_catalog(manifest, boot_script())
    write_doc(manifest)
    print("Done", flush=True)
    for era in eras:
        print(era["id"], "pages", len(era["pages"]), "failures", len(era["failures"]), "skipped", len(era["skipped"]), flush=True)


if __name__ == "__main__":
    main()
