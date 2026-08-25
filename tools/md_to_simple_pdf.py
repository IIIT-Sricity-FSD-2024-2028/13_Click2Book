from pathlib import Path
import re
import textwrap


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "BACKEND_EXPLANATION.md"
OUTPUT = ROOT / "BACKEND_EXPLANATION.pdf"


def escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def add_wrapped(lines, text, width=88, prefix=""):
    if not text:
        lines.append("")
        return
    wrapped = textwrap.wrap(text, width=width, subsequent_indent=" " * len(prefix))
    for index, line in enumerate(wrapped):
        lines.append((prefix if index == 0 else "") + line)


def markdown_to_lines(markdown: str):
    output = []
    for raw in markdown.splitlines():
        line = raw.strip()
        if not line:
            output.append("")
            continue
        line = re.sub(r"\*\*(.*?)\*\*", r"\1", line)
        line = line.replace("`", "")
        if line.startswith("# "):
            output.append(("TITLE", line[2:].strip()))
        elif line.startswith("## "):
            output.append("")
            output.append(("HEADING", line[3:].strip()))
        elif line.startswith("- "):
            add_wrapped(output, line[2:].strip(), width=82, prefix="- ")
        elif re.match(r"^\d+\. ", line):
            add_wrapped(output, line, width=84)
        else:
            add_wrapped(output, line)
    return output


def build_pdf(lines):
    pages = []
    current = []
    y = 770

    def flush_page():
        nonlocal current, y
        if current:
            pages.append(current)
        current = []
        y = 770

    for item in lines:
        if isinstance(item, tuple):
            kind, text = item
            size = 18 if kind == "TITLE" else 14
            leading = 24 if kind == "TITLE" else 20
            font = "/F2"
        else:
            text = item
            size = 10.5
            leading = 15
            font = "/F1"

        if y < 60:
            flush_page()
        if text == "":
            y -= 8
            continue

        current.append(f"BT {font} {size} Tf 50 {y} Td ({escape_pdf_text(text)}) Tj ET")
        y -= leading

    flush_page()

    objects = []
    objects.append("<< /Type /Catalog /Pages 2 0 R >>")
    kids = " ".join(f"{3 + i * 2} 0 R" for i in range(len(pages)))
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>")

    for i, commands in enumerate(pages):
        page_obj = 3 + i * 2
        stream_obj = page_obj + 1
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            f"/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> "
            f"/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> "
            f"/Contents {stream_obj} 0 R >>"
        )
        stream = "\n".join(commands)
        objects.append(f"<< /Length {len(stream.encode('latin-1'))} >>\nstream\n{stream}\nendstream")

    result = ["%PDF-1.4\n"]
    offsets = [0]
    for number, obj in enumerate(objects, start=1):
        offsets.append(sum(len(part.encode("latin-1")) for part in result))
        result.append(f"{number} 0 obj\n{obj}\nendobj\n")
    xref = sum(len(part.encode("latin-1")) for part in result)
    result.append(f"xref\n0 {len(objects) + 1}\n")
    result.append("0000000000 65535 f \n")
    for offset in offsets[1:]:
        result.append(f"{offset:010d} 00000 n \n")
    result.append(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n")
    return "".join(result).encode("latin-1")


if __name__ == "__main__":
    lines = markdown_to_lines(SOURCE.read_text(encoding="utf-8"))
    OUTPUT.write_bytes(build_pdf(lines))
    print(OUTPUT)
