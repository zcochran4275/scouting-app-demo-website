# Between the Lines — website

Marketing site for Between the Lines, opponent scouting for D1 soccer. Plain HTML, CSS and JavaScript: no install or build step.

Live at **https://betweenthelinessoccer.com** (GitHub Pages, deployed from `main`; the domain is set by the `CNAME` file).

## Pages and files

| File | What it is |
| --- | --- |
| `index.html` | Homepage: hero, opponent preparation example, app tabs (Overview, Report, Players, Scout Chat), demo booking |
| `transfer-portal.html` | Transfer Portal coming-soon page with the interest form |
| `about.html` | About page with both co-founders |
| `404.html` | Page shown for any address that doesn't exist (GitHub Pages serves it automatically) |
| `css/styles.css` | All styling. Pitch Green colours are the variables at the top; dark mode overrides sit under `:root[data-theme="dark"]` |
| `js/main.js` | Tabs, Calendly embed, interest form, animations. Settings are at the top |
| `assets/` | Favicon, social-share image (`og-image.png`), headshots and the cutback example charts |
| `robots.txt`, `sitemap.xml` | For search engines. Add new pages to `sitemap.xml` |

## Preview it

From this folder:

```
python scripts/preview.py
```

then open http://localhost:8000. This loopback-only preview serves website files and keeps local documents and Git metadata private. Unknown addresses show the 404 page, like the live site. Stop it with Ctrl+C.

## Things to remember when editing

- **Bump the `?v=` number** on the `styles.css` and `main.js` links (in all four HTML pages) whenever either file changes. Browsers cache them, so without the bump visitors can see old styling with new pages.
- **Calendly** is set by `CALENDLY_URL` in `js/main.js`. It loads only when a visitor scrolls near the booking section.
- **Interest form** sends through Web3Forms (`INTEREST_FORM_ACCESS_KEY` in `js/main.js`; the key is public by design and can only send mail to the inbox it was created with). A hidden `botcheck` field catches spam bots. Web3Forms blocks headless browsers, so test it in a normal browser window.
- **New page?** Copy the header, footer and `<head>` tags from an existing page, then add it to `sitemap.xml`.
- **Chart text:** the three SVGs in `assets/cutback-example/` display at about 300px wide, so keep their text large relative to the drawing.
- **Social preview:** `assets/og-image.png` (1200 × 630) is what shows when a link is shared.
- **Data source wording:** confirm with Hudl/Wyscout before naming them on the site.
