from pathlib import Path

from v3.core.parser import CaptionParser


def main() -> None:
    """Manueller Testlauf für den Closecaption-Parser."""

    repo_root = Path(__file__).resolve().parents[2]
    source_file = repo_root / "closecaption" / "closecaption_english.txt"

    parser = CaptionParser()
    lines = parser.parse_file(str(source_file))

    print("Erste 5 Zeilen:")
    for line in lines[:5]:
        print(f"{line.line_number}: {line.key} -> {line.original_text}")

    print(f"Gesamtanzahl der Zeilen: {len(lines)}")


if __name__ == "__main__":
    main()
