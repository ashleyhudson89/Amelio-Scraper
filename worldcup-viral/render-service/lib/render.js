import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates");

// IG carousel slide: 1080x1350 (4:5) is the largest IG-allowed crop and gets
// more screen real estate than square. Same dimensions for all templates.
const SLIDE_W = 1080;
const SLIDE_H = 1350;

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    });
  }
  return browserPromise;
}

async function loadTemplate(name) {
  const path = join(TEMPLATES_DIR, `${name}.html`);
  return readFile(path, "utf8");
}

function applyTemplate(html, data) {
  // {{key}} or {{key.subkey}} — keep this dumb; templates do the heavy lifting in CSS.
  return html.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
    const val = path.split(".").reduce((obj, key) => obj?.[key], data);
    return val == null ? "" : String(val);
  });
}

export async function renderCarousel(template, slides) {
  const raw = await loadTemplate(template);
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });

  const pngs = [];
  try {
    for (const slide of slides) {
      const html = applyTemplate(raw, slide);
      await page.setContent(html, { waitUntil: "networkidle0" });
      const buf = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H } });
      pngs.push(buf);
    }
  } finally {
    await page.close();
  }
  return pngs;
}
