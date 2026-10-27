# Between the Lines — website

Marketing site for Between the Lines, opponent scouting for D1 soccer. Plain HTML, CSS and JavaScript: no install or build step.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Homepage: rotating-questions hero, app tabs (Overview, Report, Players, Scout Chat), demo booking |
| `transfer-portal.html` | Transfer Portal coming-soon page with interest form |
| `about.html` | About page with both co-founders |
| `css/styles.css` | All styling. Pitch Green colours are the variables at the top |
| `js/main.js` | Tabs, Calendly embed, interest form. Settings at the top |
| `assets/` | Favicon; put photos here |

## Preview it

Double-click `index.html` to open it in your browser. Or, from this folder:

```
python scripts/preview.py
```

then open http://localhost:8000. This loopback-only preview serves website files and keeps local documents and Git metadata private. Stop it with Ctrl+C.

## Before launch

1. **Calendly.** In `js/main.js`, set `CALENDLY_URL` to your event link. Until then, the demo section shows an "Email us" button.
2. **Interest form.** In `js/main.js`, set `INTEREST_FORM_ENDPOINT` to a form service such as Formspree. Until then, the form opens an email to you.
3. **Alpaslan's bio.** Replace the bracketed placeholder in `about.html`.
4. **Photos.** Add images to `assets/` and swap the `[Photo of …]` boxes in `about.html` for `<img>` tags (there's a comment showing how).
5. **Data source wording.** Confirm with Hudl/Wyscout before naming them on the site.

## Deploy

Any static host works. The quickest:

- **Netlify:** drag this folder onto app.netlify.com/drop.
- **Vercel or GitHub Pages:** push the folder to a GitHub repo and import it. No build command; the output folder is the root.

Then point your domain at it.
