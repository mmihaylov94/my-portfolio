// Converts build/Mihail_Mihaylov_CV.docx to PDF via LibreOffice and copies the
// result to ../public/Mihail_Mihaylov_CV.pdf, which is what the site serves.
//
// If LibreOffice is not installed, this fails with instructions rather than
// silently producing nothing. Opening the .docx in Word and exporting to
// ../public/Mihail_Mihaylov_CV.pdf gives the same result.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DOCX = path.join(__dirname, 'build', 'Mihail_Mihaylov_CV.docx');
const PDF_BUILT = path.join(__dirname, 'build', 'Mihail_Mihaylov_CV.pdf');
const PDF_PUBLIC = path.join(__dirname, '..', 'public', 'Mihail_Mihaylov_CV.pdf');

// On Windows, use soffice.com, the console launcher. soffice.exe is a GUI
// program, so `--version` allocates its own hidden console and blocks on it.
const CANDIDATES = [
  'soffice',
  'C:\\Program Files\\LibreOffice\\program\\soffice.com',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
  '/usr/bin/soffice',
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
];

function findSoffice() {
  for (const candidate of CANDIDATES) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // try the next one
    }
  }
  return null;
}

if (!fs.existsSync(DOCX)) {
  console.error('No .docx found. Run `npm run build` first.');
  process.exit(1);
}

const soffice = findSoffice();

if (!soffice) {
  console.error(
    [
      'LibreOffice was not found, so the PDF was not generated.',
      '',
      'The .docx is ready at:',
      '  ' + DOCX,
      '',
      'Either install LibreOffice and run this again, or open that file in Word',
      'and export it to:',
      '  ' + PDF_PUBLIC,
    ].join('\n'),
  );
  process.exit(1);
}

execFileSync(soffice, [
  '--headless',
  '--convert-to', 'pdf',
  '--outdir', path.join(__dirname, 'build'),
  DOCX,
], { stdio: 'inherit' });

fs.copyFileSync(PDF_BUILT, PDF_PUBLIC);
console.log('Wrote ' + PDF_PUBLIC);
