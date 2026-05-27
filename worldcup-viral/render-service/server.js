import express from "express";
import { renderCarousel } from "./lib/render.js";

const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.RENDER_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error("RENDER_AUTH_TOKEN is required. See .env.example.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/render", async (req, res) => {
  if (req.header("x-auth") !== AUTH_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const { template, slides } = req.body ?? {};
  if (!template || !Array.isArray(slides) || slides.length === 0) {
    return res.status(400).json({ error: "expected { template: string, slides: object[] }" });
  }
  try {
    const pngs = await renderCarousel(template, slides);
    res.json({ images: pngs.map((buf) => buf.toString("base64")) });
  } catch (err) {
    console.error("render failed", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`render service on :${PORT}`));
