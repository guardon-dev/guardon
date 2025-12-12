/* eslint-disable no-undef */
// This script is intended for Node.js, where 'process' is defined globally.

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function run() {
  const repoRoot = process.cwd();
  const svgRel = path.join('assets', 'architecture-diagram.svg');
  const svgPath = path.resolve(repoRoot, svgRel);
  const outRel = path.join('assets', 'architecture-diagram.png');
  const outPath = path.resolve(repoRoot, outRel);

  if (!fs.existsSync(svgPath)) {
    console.error('SVG not found at', svgPath);
    process.exit(2);
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:transparent;"><img id="svg" src="file://${svgPath.replace(/\\/g, '/')}" style="display:block; width:100%; height:auto;"/></body></html>`;
  const tmpHtml = path.resolve(repoRoot, '.tmp-svg-render.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');

  const browser = await puppeteer.launch({args: ['--no-sandbox','--disable-setuid-sandbox']});
  try {
    const page = await browser.newPage();
    await page.goto('file://' + tmpHtml);

    // wait for the image to load
    await page.waitForSelector('#svg', {timeout: 3000});
    const el = await page.$('#svg');
    const bounding = await el.boundingBox();
    // give a default if bounding failed
    const width = Math.ceil(bounding ? bounding.width : 1000);
    const height = Math.ceil(bounding ? bounding.height : 560);

    await page.setViewport({width, height});
    // take a screenshot of the element
    await el.screenshot({path: outPath});
    console.log('Wrote PNG to', outPath);
  } finally {
    await browser.close();
    try { fs.unlinkSync(tmpHtml); } catch (e) {}
  }
}

run().catch(err => { console.error(err); process.exit(1); });
