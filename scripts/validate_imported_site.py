from pathlib import Path
from urllib.parse import urlparse
from html.parser import HTMLParser


class ResourceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = dict(attrs)
        for key in ("href", "src"):
            value = attrs_map.get(key)
            if value:
                self.resources.append(value)


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ENTRY = PUBLIC / "kimi" / "en" / "index.html"
parser = ResourceParser()
parser.feed(ENTRY.read_text(encoding="utf-8", errors="ignore"))

missing: list[tuple[str, Path]] = []
checked = 0
for resource in parser.resources:
    parsed = urlparse(resource)
    if (
        parsed.scheme
        or parsed.netloc
        or resource.startswith("/")
        or resource.startswith("data:")
        or resource.startswith("#")
    ):
        continue
    checked += 1
    candidate = (ENTRY.parent / resource).resolve()
    try:
        candidate.relative_to(PUBLIC.resolve())
    except ValueError:
        missing.append((resource, candidate))
        continue
    if not candidate.is_file():
        missing.append((resource, candidate))

print(f"Checked {checked} local resource references in {ENTRY.relative_to(ROOT)}")
if missing:
    print("Missing resources:")
    for resource, candidate in missing:
        print(f"- {resource} -> {candidate}")
    raise SystemExit(1)
print("All local imported-site resources resolve inside public/.")
