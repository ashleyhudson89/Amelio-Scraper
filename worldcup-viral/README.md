# worldcup-viral

Instagram virality engine for the 2026 FIFA World Cup. n8n Cloud handles the orchestration (scheduling, fetching odds & results, drafting copy with OpenAI, publishing); a small Node.js render service turns slide data into the IG carousel PNGs. Five content formats, two pillars (value bets + curse stats), one consistent visual identity.

> **Status**: v1 scaffolding. Render service is functional end-to-end. n8n workflows ship as one fully-fleshed canonical example (`01-daily-value-bet`) plus skeletons for the other four — fill in Code-node logic and credentials to activate. **Data files (`fixtures.json`) need the real draw filled in before anything publishes.**

## Architecture

```
n8n Cloud (orchestration)
   │
   ├─ Schedule trigger
   ├─ Fetch odds / form / results  (The Odds API · Football-Data.org)
   ├─ Compute (value picks, curse selection, dedupe)
   ├─ OpenAI (draft slide JSON via prompts/*.md)
   ├─ POST /render to ──────────────────►  Render service (this repo)
   │                                          ↓
   │                                      Puppeteer renders 5–7 PNG slides
   │                                          ↓
   │                                       returns base64 PNGs
   │                                          ↓
   └─ IF auto: Instagram Graph API
      ELSE:    Telegram (manual review)
```

The repo holds: the render service code, the carousel templates, the static data (teams, fixtures stub, curses, scandal seeds), the OpenAI prompts, the n8n workflow JSONs, and the content strategy doc.

## Repo layout

```
worldcup-viral/
├── render-service/
│   ├── server.js                  # Express app, one /render endpoint
│   ├── lib/
│   │   ├── render.js              # Puppeteer HTML→PNG (1080×1350, browser pool)
│   │   └── sample.js              # smoke test: renders one of each template
│   └── templates/
│       ├── value-bet.html         # the 5 carousel templates
│       ├── curse-stat.html
│       ├── pre-match.html
│       ├── post-match.html
│       └── scandal.html
├── data/
│   ├── teams.json                 # 48 teams w/ Elo + FIFA rank
│   ├── fixtures.json              # 12 groups, hosts pre-seeded — REST IS TODO
│   ├── curses.json                # curated streak stats
│   └── scandals.json              # editorial seeds for the drama thread
├── prompts/                       # OpenAI system prompts (one per content type)
├── n8n/
│   ├── README.md                  # full n8n setup walkthrough
│   └── workflows/                 # 5 importable workflow JSONs
├── content-strategy.md            # the WHY — playbook, cadence, what NOT to do
├── Dockerfile                     # deploy the render service anywhere
├── .env.example                   # every credential, in one place
└── package.json
```

## 30-minute setup checklist

1. **Create the new GitHub repo on github.com** (this repo's contents are in the `worldcup-viral/` subdirectory of the Amelio-Scraper branch — `cp -r` it into the new repo's working copy, or use `git subtree split` to extract).
2. **Deploy the render service**. The fastest route is Render.com:
   - New → Web Service → connect the new repo
   - Build command: `npm install`
   - Start command: `npm start`
   - Add env var `RENDER_AUTH_TOKEN` with a long random string
   - Free tier auto-sleeps after 15 min idle; cold start is ~20s. Acceptable for v1.
3. **Smoke test it**. Locally:
   ```bash
   cd worldcup-viral
   npm install
   RENDER_AUTH_TOKEN=test npm start
   # in another terminal:
   curl -X POST localhost:3000/render \
     -H 'x-auth: test' -H 'Content-Type: application/json' \
     -d '{"template":"value-bet","slides":[{"slot":"hook","kicker":"VALUE BET","title":"5 underdogs","subtitle":"Sample","handle":"@yourhandle","slide_num":"1/2"}]}'
   ```
   Decode the base64 in the response → PNG. Should look like a usable IG slide.
4. **Set up n8n credentials** (OpenAI · The Odds API · Football-Data.org · Instagram Graph API · Telegram). See `n8n/README.md` for the painful Instagram setup details.
5. **Import `n8n/workflows/01-daily-value-bet.json`** into n8n Cloud. Wire up the Code node's reference to `teams.json` (easiest: HTTP-fetch the raw GitHub URL). Set `PUBLISH_MODE=manual` so the first runs go to Telegram for inspection.
6. **Fill in `data/fixtures.json`** with the actual 2026 draw. The stub only has the three host seeds (Mexico A1, Canada B1, USA D1).
7. **Test-fire the workflow**. Click "Execute" manually in n8n. You should see a Telegram message with the draft caption.
8. **Build out workflows 02–05** by copying the canonical workflow's structure. The skeletons in `n8n/workflows/` show the node layout; the Code/HTTP node parameters are what you need to fill in.
9. **Once you trust the output**, flip `PUBLISH_MODE=auto` for value-bet and curse-stat. **Keep scandal manual forever.**

## Sample render output

To preview what the templates look like without n8n in the loop:

```bash
cd worldcup-viral
npm install
RENDER_AUTH_TOKEN=test npm run render:sample
# → writes 10 PNGs to ./out/, one for each (template × slot) combination
```

Inspect the PNGs. If you don't like the colours, edit the `:root` CSS variables in the template files — `--accent` and `--secondary` are the two you'll touch most.

## What's intentionally NOT in v1

- **No automatic dataset-update job for `data/teams.json` Elo ratings.** Update manually monthly, or add a `00-weekly-data-refresh` workflow.
- **No A/B testing of headlines.** Add later by routing 50% of drafts to Telegram + 50% auto, and comparing engagement.
- **No analytics pipeline.** Use IG Insights manually. Wire up `instagram_insights` Graph API endpoint to a Postgres table once you're past v1.
- **No video content.** Reels are higher-effort and lower-leverage at v1 scale. Pillar 1 + 2 are static-carousel formats by design.
- **No multi-language.** English only. See content-strategy.md for why.

## Legal / responsibility

- Value-bet posts MUST include the responsible-gambling line in every caption — already enforced in the OpenAI prompt.
- Scandal posts MUST be manually reviewed. The `05-scandal-editorial` workflow has no auto-publish branch. Do not add one.
- This is unauthorised commentary, not affiliated with FIFA. Avoid using FIFA's logos/branding in the carousels. The current templates use no FIFA assets.

## Pointer to the rest

- **Content strategy + cadence**: `content-strategy.md`
- **n8n setup details**: `n8n/README.md`
- **Why each design choice**: this README's parent thread on Claude, summarised in the docs above.
