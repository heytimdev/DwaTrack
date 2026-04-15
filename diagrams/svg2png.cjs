const puppeteer = require('C:/Users/user/AppData/Roaming/npm/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const targets = [
  { svg: 'context.svg',   png: 'context.png',   w: 2400, h: 1500, scale: 3 },
  { svg: 'dfd.svg',       png: 'dfd.png',       w: 4000, h: 2400, scale: 2 },
  { svg: 'usecase.svg',   png: 'usecase.png',   w: 2600, h: 2000, scale: 3 },
  { svg: 'flowchart.svg', png: 'flowchart.png', w: 5074, h: 5110, scale: 2 },
];

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const t of targets) {
    const svgPath = path.resolve(__dirname, t.svg);
    if (!fs.existsSync(svgPath)) { console.log(`Skipping ${t.svg} (not found)`); continue; }
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:white">${svgContent}</body></html>`;
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: t.scale });
    await page.screenshot({ path: path.resolve(__dirname, t.png), clip: { x:0, y:0, width:t.w, height:t.h } });
    await page.close();
    console.log('Done:', t.png);
  }

  await browser.close();
})();
