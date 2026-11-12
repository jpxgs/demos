# Fonts and design

The page is type, space, and alignment. Section labels are small uppercase mono. Body text is a plain sans. There are no boxes around lists, no filled buttons, and no pictures except approved headshots.

## What is used

| Face | Weights | Where |
| --- | --- | --- |
| IBM Plex Sans | 400 and 600 | Body text and the name |
| IBM Plex Mono | 400 and 500 | Navigation, section labels, dates, form labels, catalog details |

The files are in `fonts/`. They are Latin subsets, `woff2`, with `font-display: swap` in `style.css`. Only those four weights are loaded.

The license is the SIL Open Font License. The text is `fonts/OFL.txt`. You may use the fonts on this site. Do not sell the font files by themselves.

## Change a color

Open `style.css` and edit the values under `:root`.

| Name | Role | Current |
| --- | --- | --- |
| `--ink` | Text | `#1c1b19` |
| `--muted` | Secondary text | `#4f4b46` |
| `--paper` | Page background | `#faf8f5` |

Keep text dark on a light background. Small label text needs strong contrast. After a change, check the page on a phone and run the browser tests if you can.

## Change a font

1. Put the new `woff2` files in `fonts/`.
2. In `style.css`, update the `@font-face` blocks: family name, weight, and file name.
3. Keep `font-display: swap`.
4. Load only the weights the page uses.
5. Use a license you are allowed to put on a public site. OFL or an equivalent free license is the expectation.
6. Update the preload lines in `index.html` if the file names changed.

Do not point `style.css` at a font host. The package is meant to work as files you upload.

## Spacing

Sections are separated by space, not rules. Lists line up in one column. Catalog details sit on the same row as the title on a wide screen and drop under the title on a narrow screen. If a change makes the page feel boxed in, remove the border and add space instead.
