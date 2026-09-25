# CV

Generates `Mihail_Mihaylov_CV.docx` and the PDF the site serves from `public/`.

This folder is deliberately self-contained. It has its own `package.json` so that
`docx` never lands in the portfolio's dependency tree, and so nothing here can
break `npm ci` in CI or the Docker build. `pnpm-workspace.yaml` defines no
`packages:` globs, so this is not picked up as a workspace member. The root
`eslint.config.mjs` ignores `cv/**`, since this code follows its own style.

`generate.js` is CommonJS. That works because the nearest `package.json` is this
one, which does not set `"type": "module"`.

## Install, once

```bash
cd cv
npm install
```

## Install the fonts, once

`fonts/` holds three TrueType files. **Install them on your machine** before
generating a PDF. Without them, LibreOffice and Word substitute something else
and the layout shifts.

On Windows: select all three, right click, Install for all users.

These are converted from `@fontsource/libre-franklin`, which ships woff2 that
LibreOffice will not read. The conversion also rewrites the name table, because
otherwise every weight registers as "Libre Franklin Thin" and the document
renders wrong. Licence in `fonts/OFL.txt`.

## Build

```bash
npm run cv        # docx, then PDF into ../public/
```

Or separately:

```bash
npm run build     # build/Mihail_Mihaylov_CV.docx
npm run pdf       # converts it and copies to ../public/Mihail_Mihaylov_CV.pdf
```

If LibreOffice is not installed, `npm run pdf` says so and stops. Open the
`.docx` in Word and export to `../public/Mihail_Mihaylov_CV.pdf` instead.

## Editing

`generate.js` is the source of truth. The PDF and the `.docx` are build
artefacts, and `build/` is gitignored.

Design tokens sit at the top:

```js
const BLUE  = '0F5581';   // headings, name, project titles
const LBLUE = '5C89A6';   // company names
const GREY  = '595959';   // dates, locations, secondary text
const S     = 18;         // base size in half-points, so 9pt
```

Content is built from small helpers: `sectionHeading`, `body`, `bullet`,
`pBullet`, `projectName`, `projectDesc`, `roleLine`, `subLine`, `intro`.
Most edits are a string change inside one of those calls.

Two things worth knowing before changing spacing:

- Dates sit hard right using a real right tab stop at `RIGHT_EDGE`, not spaces.
- Role headers carry `keepNext: true`, which stops a job title stranding itself
  at the foot of a page.

## Check before you ship

The CV is meant to be two pages. Nothing enforces that, so after any edit:

```bash
pdfinfo build/Mihail_Mihaylov_CV.pdf | grep Pages
```

If it has spilled to three, tighten the `spacing` values in the helpers rather
than cutting content.
