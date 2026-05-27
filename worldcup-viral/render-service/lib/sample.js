// Smoke test: render one slide from each template to ./out/ for visual inspection.
// Run with `npm run render:sample`.
import { mkdir, writeFile } from "node:fs/promises";
import { renderCarousel } from "./render.js";

const samples = {
  "value-bet": [
    { slot: "hook", kicker: "VALUE BET", title: "5 underdogs the bookies got wrong", subtitle: "Group stage edition · Match day 1" },
    { slot: "pick", rank: "01", team: "JAPAN", odds: "5.50", line: "to beat Germany", reason: "Elo says 38% — bookies imply 18%" },
  ],
  "curse-stat": [
    { slot: "hook", kicker: "THE CURSE", title: "No champion since 2010 has escaped the group stage", subtitle: "Argentina, you're up." },
    { slot: "body", line: "Italy 2010 · Out." },
  ],
  "pre-match": [
    { slot: "hook", kicker: "TONIGHT", title: "ARGENTINA · MEXICO", subtitle: "8pm ET · MetLife · Group A" },
    { slot: "stat", label: "Head to head", value: "ARG W17 D14 L7" },
  ],
  "post-match": [
    { slot: "hook", kicker: "FULL TIME", title: "BRA 2 — 1 ENG", subtitle: "Vinícius brace · Saka late consolation" },
    { slot: "stat", label: "xG", value: "BRA 2.1 — 1.6 ENG" },
  ],
  scandal: [
    { slot: "hook", kicker: "INSIDE THE CAMP", title: "Nigeria's bonus war just got worse", subtitle: "What we know, 48hr before kickoff" },
    { slot: "body", line: "Sources told local press the squad voted to skip Tuesday's session." },
  ],
};

await mkdir("./out", { recursive: true });

for (const [template, slides] of Object.entries(samples)) {
  const pngs = await renderCarousel(template, slides);
  for (let i = 0; i < pngs.length; i++) {
    const path = `./out/${template}-${i + 1}.png`;
    await writeFile(path, pngs[i]);
    console.log(`wrote ${path}`);
  }
}
process.exit(0);
