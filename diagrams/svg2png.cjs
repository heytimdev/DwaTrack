const puppeteer = require('C:/Users/user/AppData/Roaming/npm/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const svgPath = path.resolve(__dirname, 'context.svg');
  const outPath = path.resolve(__dirname, 'context.png');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:white">${svgContent}</body></html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1400, height: 900 } });
  await browser.close();
  console.log('Done:', outPath);
})();
