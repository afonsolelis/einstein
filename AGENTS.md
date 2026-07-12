# Project Context
A static content site for a Data Science & AI course curriculum.

## Key Architecture
- **Monolithic Frontend**: `index.html` is self-contained (HTML, CSS, and JS) and requires no build process.
- **Content Source**: Lesson data and display logic are controlled via the `aulas` array within `index.html`.

## Directory Structure & Navigation
- **Slides**: Located in `slides/` (e.g., `aula-01.html`).
- **Materials**: Located in `materiais/` per lesson (e.g., `materiais/aula-XX/`).

## Development Commands
- **Local Server**: Run `python3 -m http.server 8000` to serve the site and enable navigation between linked content.