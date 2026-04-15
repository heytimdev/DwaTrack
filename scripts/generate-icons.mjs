/**
 * Generates PWA icons (192x192 and 512x512) from the logo SVG.
 * Run once: node scripts/generate-icons.mjs
 * Requires: npm install -D sharp
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

const svg = readFileSync(resolve(root, 'public/logo.svg'));

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(root, `public/icons/icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

console.log('Icons generated in public/icons/');
