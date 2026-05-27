# HANDOVER — pick up tomorrow on laptop

> **Total time estimate**: ~3 hours of focused work, of which ~45 min is the Instagram API setup (the only part that's genuinely painful). Everything else is copy-paste.
>
> **Your only real decisions**: (1) the new repo's name, (2) the IG account handle, (3) where to put the render service URL. Everything else is pre-decided in this doc.
>
> **What to have open**: terminal, browser, the Instagram account you'll post from, your phone (for Telegram + Meta two-factor).

---

## Quick context recap

You're building an automated Instagram virality engine for World Cup 2026. The pipeline:

```
n8n Cloud (schedule + fetch + OpenAI draft + publish)
   ↓ HTTP POST
Render service (this repo on Render.com — turns slide JSON into PNG carousels)
   ↓
Either: Instagram Graph API (auto) OR Telegram (manual review queue)
```

The code is already written, committed, and pushed to the branch `claude/world-cup-instagram-strategy-6ME8S` on `ashleyhudson89/Amelio-Scraper`. Everything you do tomorrow is **wiring**, not coding.

---

## PART 1 — Pull the code (5 min)

```bash
# Anywhere you keep projects:
cd ~/code   # or wherever
git clone https://github.com/ashleyhudson89/Amelio-Scraper.git amelio-temp
cd amelio-temp
git checkout claude/world-cup-instagram-strategy-6ME8S
ls worldcup-viral/   # should show README.md, render-service/, n8n/, data/, etc.
```

You should see this structure under `worldcup-viral/`:

```
README.md          content-strategy.md   HANDOVER.md  (this file)
Dockerfile         package.json          .env.example
render-service/    data/                 prompts/     n8n/
```

---

## PART 2 — Create the new GitHub repo and extract the subdirectory (10 min)

The code lives in a subdirectory of Amelio-Scraper. We need it to be its own repo. Two clean ways: pick **Option A** if you want a clean history; **Option B** if you don't care about preserving git history (faster, simpler).

### Option A — preserve git history (use `git subtree split`)

```bash
cd ~/code/amelio-temp

# 1. Extract worldcup-viral as a new branch with just that subdirectory's history
git subtree split --prefix=worldcup-viral -b worldcup-viral-only

# 2. Create a new empty repo on github.com:
#    - Go to https://github.com/new
#    - Owner: ashleyhudson89
#    - Repository name: worldcup-viral  (or whatever you want — write it down)
#    - Private or Public — your call. Recommend Private until live.
#    - Do NOT initialise with README, .gitignore, or licence (we have those).
#    - Click "Create repository".

# 3. Push the extracted branch as the new repo's main:
cd ~/code
git clone -b worldcup-viral-only ../amelio-temp/.git worldcup-viral
cd worldcup-viral
git remote remove origin
git remote add origin https://github.com/ashleyhudson89/worldcup-viral.git
git branch -M main
git push -u origin main
```

### Option B — fresh history (simpler, no subtree dance)

```bash
# 1. Create the empty repo on github.com (same as Option A step 2 above).

# 2. Copy the subdirectory and init a fresh repo:
cp -r ~/code/amelio-temp/worldcup-viral ~/code/worldcup-viral
cd ~/code/worldcup-viral
git init
git add .
git commit -m "Initial commit: worldcup-viral scaffold"
git branch -M main
git remote add origin https://github.com/ashleyhudson89/worldcup-viral.git
git push -u origin main
```

### Verify

Go to `https://github.com/ashleyhudson89/worldcup-viral` — you should see the full file tree.

You can now `rm -rf ~/code/amelio-temp` if you want; the Amelio-Scraper branch is no longer the source of truth.

---

## PART 3 — Deploy the render service to Render.com (15 min)

Render.com free tier is perfect for this. The service auto-sleeps after 15 min idle (cold start ~20s) which is fine for v1.

### Steps

1. Go to https://render.com → **Sign up** (use GitHub auth — faster).
2. **Authorise Render** to access `ashleyhudson89/worldcup-viral` only (don't grant blanket access).
3. Dashboard → **New +** → **Web Service**.
4. Connect the `worldcup-viral` repo. Click **Connect**.
5. Configure (these are the exact values to enter):
   - **Name**: `worldcup-viral-render`
   - **Region**: pick whichever is closest to where you'll be (latency doesn't matter much here)
   - **Branch**: `main`
   - **Runtime**: `Docker` *(Render auto-detects from the Dockerfile)*
   - **Instance Type**: `Free`
6. **Environment Variables** — click "Advanced", add:
   - `RENDER_AUTH_TOKEN` → generate a long random string and SAVE IT (you'll need it in n8n).
     - Easy generator: `openssl rand -hex 32` in your terminal.
   - `PORT` → `3000`
7. Click **Create Web Service**. First deploy takes ~5–8 min (Puppeteer Docker image is fat).

### Verify

Once Render shows "Live", open the URL it gave you (something like `https://worldcup-viral-render.onrender.com`) and append `/health`:

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
# → {"ok":true}
```

Then test a real render (replace YOUR-URL and YOUR-TOKEN):

```bash
curl -X POST https://YOUR-RENDER-URL.onrender.com/render \
  -H 'x-auth: YOUR-TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"template":"value-bet","slides":[{"slot":"hook","kicker":"VALUE BET","title":"5 underdogs the bookies got wrong","subtitle":"Test render","handle":"@test","slide_num":"1/1"}]}' \
  | jq -r '.images[0]' | base64 -d > /tmp/test.png
open /tmp/test.png   # macOS — should show a usable carousel slide
```

**Write down**:
```
RENDER_SERVICE_URL = https://YOUR-RENDER-URL.onrender.com
RENDER_AUTH_TOKEN  = (the string you generated)
```

---

## PART 4 — Get all API keys (20 min)

Open these in tabs and grab each key. Save them all in a temporary text file for now — you'll paste them into n8n in Part 6.

### 4.1 OpenAI (5 min)

1. https://platform.openai.com → log in / sign up.
2. Top-right avatar → **View API keys** → **Create new secret key**.
3. Name it `worldcup-viral`. Copy the `sk-...` key.
4. **Billing**: add a payment method if you haven't. Set a usage limit (Settings → Limits) of $50/month — more than enough for v1.

```
OPENAI_API_KEY = sk-...
```

### 4.2 The Odds API (3 min)

1. https://the-odds-api.com → **Get API Key** (free tier: 500 req/month — enough at 1–2 requests/day for value-bet).
2. They email you the key.

```
ODDS_API_KEY = ...
```

### 4.3 Football-Data.org (3 min)

1. https://www.football-data.org/client/register
2. Free tier: 10 requests/minute, covers WC competition.
3. Verify email, copy your auth token from the dashboard.

```
FOOTBALL_DATA_TOKEN = ...
```

### 4.4 Telegram bot (5 min)

1. Open Telegram, search `@BotFather`, start chat.
2. Send `/newbot`. Pick a name (e.g. "WC Viral Review") and a username ending in `bot` (e.g. `wc_viral_review_bot`).
3. BotFather replies with a token. Copy it.
4. Send your new bot any message (start with `/start`).
5. In your browser open `https://api.telegram.org/bot<TOKEN>/getUpdates` (paste your token in). Look for `"chat":{"id":NUMBER` — that's your chat ID.

```
TELEGRAM_BOT_TOKEN = 1234:ABCD...
TELEGRAM_CHAT_ID   = 123456789
```

### 4.5 Instagram — see PART 5 (the long one)

---

## PART 5 — Instagram Graph API setup (45 min, painful but linear)

This is the only genuinely tedious part. Follow it in order, don't skip steps.

### 5.1 Convert Instagram to a Professional account (5 min)

1. On your phone, open the IG account you'll post from.
2. **Settings → Account → Switch to Professional Account**.
3. Pick **Creator** or **Business** (either works for the Graph API — Business has more analytics).
4. Pick category "Sports" or "Media/News Company".
5. You'll be prompted to **connect to a Facebook Page**. If you don't have one:
   - Open Facebook → **Pages → Create New Page**.
   - Page name: same as IG handle (or your brand).
   - Category: "Sports Team" or "Media/News Company".
6. Link IG → Page when prompted.

### 5.2 Create a Meta Developer App (10 min)

1. Go to https://developers.facebook.com → log in with the same Facebook account that owns the Page from 5.1.
2. **My Apps → Create App**.
3. **Use case**: "Other" → Next.
4. **App type**: "Business" → Next.
5. **App name**: `worldcup-viral`. Email: your email. Click **Create App** (may require Facebook password re-entry).

### 5.3 Add the right products to the app (5 min)

In your new app's dashboard sidebar:

1. **Add Product** → find **Instagram Graph API** → click **Set Up**.
2. **Add Product** → find **Facebook Login for Business** → **Set Up**. *(Not the regular "Facebook Login" — the "for Business" variant.)*

### 5.4 Generate a long-lived access token (15 min — the fiddly part)

1. Sidebar → **Tools → Graph API Explorer**.
2. **Meta App** dropdown (top right): select `worldcup-viral`.
3. **User or Page** dropdown: select **Get User Access Token**.
4. **Permissions** — click "Add Permissions" and tick:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
5. Click **Generate Access Token**. Facebook will prompt you to authorise — say yes, select the Page from 5.1.
6. Copy the **short-lived token** (starts `EAA...`).
7. Now exchange it for a long-lived (60-day) token. In your terminal:

```bash
# Get your App ID and App Secret first:
#   developers.facebook.com → your app → Settings → Basic
# App Secret: click "Show", may need password re-entry.

APP_ID="paste-app-id"
APP_SECRET="paste-app-secret"
SHORT_TOKEN="paste-short-lived-token"

curl -G "https://graph.facebook.com/v19.0/oauth/access_token" \
  --data-urlencode "grant_type=fb_exchange_token" \
  --data-urlencode "client_id=$APP_ID" \
  --data-urlencode "client_secret=$APP_SECRET" \
  --data-urlencode "fb_exchange_token=$SHORT_TOKEN"
# → {"access_token":"EAA...","token_type":"bearer","expires_in":5183944}
```

Copy the new `access_token`. This one's good for ~60 days.

8. Now exchange the USER long-lived token for a PAGE access token (which never expires as long as you don't change your Facebook password):

```bash
LONG_USER_TOKEN="paste-from-step-7"

# Find your page ID:
curl "https://graph.facebook.com/v19.0/me/accounts?access_token=$LONG_USER_TOKEN" | jq
# → shows your page(s). Note the "id" of the Page from 5.1.

PAGE_ID="paste-page-id"

# Get the Page Access Token + Instagram Business Account ID in one shot:
curl "https://graph.facebook.com/v19.0/$PAGE_ID?fields=access_token,instagram_business_account&access_token=$LONG_USER_TOKEN" | jq
# → {"access_token":"EAA...", "instagram_business_account":{"id":"178..."}, ...}
```

**Save**:

```
IG_USER_ID       = (the instagram_business_account.id value)
IG_ACCESS_TOKEN  = (the access_token from this last response — the PAGE token, not the USER token)
```

### 5.5 Sanity-check by fetching your IG profile (2 min)

```bash
curl "https://graph.facebook.com/v19.0/$IG_USER_ID?fields=username,name,followers_count&access_token=$IG_ACCESS_TOKEN"
# → {"username":"yourhandle","name":"...","followers_count":0,"id":"..."}
```

If this works, the IG side is done. If not, the most common failure is missing permissions — re-run 5.4 and double-check all 5 permissions were granted.

### 5.6 App Review (DEFER until v2)

To publish to accounts you don't own, you'd need App Review. For now, your app is in **Development Mode** which can ONLY publish to accounts that are admins of the app. That's fine — you ARE the admin, so you can publish to your own account.

If you later want collaborators to use the same app: developers.facebook.com → app → Roles → add as Tester/Admin.

---

## PART 6 — Wire up n8n Cloud (15 min)

You said you've got the n8n CLI locally. Two paths:

### Path A — n8n Cloud only (recommended for production)

1. https://app.n8n.cloud → log in (or sign up for the free starter trial).
2. **Settings → Variables** — add these as workflow variables:
   ```
   RENDER_SERVICE_URL    = https://YOUR-RENDER-URL.onrender.com
   RENDER_AUTH_TOKEN     = (from Part 3)
   IG_USER_ID            = (from Part 5)
   IG_ACCESS_TOKEN       = (from Part 5)
   TELEGRAM_CHAT_ID      = (from Part 4.4)
   PUBLISH_MODE          = manual
   ```
3. **Credentials** — left sidebar — **+ Add Credential**. Create one for each:
   - **OpenAI** → API Key → paste `OPENAI_API_KEY`. Name: `openai-worldcup`.
   - **HTTP Header Auth** (used for Football-Data) → Name: `X-Auth-Token`, Value: paste token. Name: `football-data`.
   - **Telegram** → Bot Token: paste `TELEGRAM_BOT_TOKEN`. Name: `telegram-review`.
   - The Odds API doesn't need a credential — it uses the API key as a query param, set inline in the workflow.

### Path B — local n8n via CLI for testing first

If you want to dry-run on your laptop before pushing to cloud:

```bash
# Install if you haven't:
npm install -g n8n

# Run locally:
n8n start
# → opens http://localhost:5678
```

Then import the workflow JSONs via the CLI (these commands work locally; for cloud you import via the UI):

```bash
cd ~/code/worldcup-viral
n8n import:workflow --input=n8n/workflows/01-daily-value-bet.json
n8n import:workflow --input=n8n/workflows/02-curse-stat-pre-match.json
n8n import:workflow --input=n8n/workflows/03-pre-match-build-up.json
n8n import:workflow --input=n8n/workflows/04-post-match-analysis.json
n8n import:workflow --input=n8n/workflows/05-scandal-editorial.json
```

Test on local, then export back with `n8n export:workflow --all --output=...` and re-import into cloud via the UI. Either way, the workflow JSON in the repo is the source of truth.

---

## PART 7 — Import + configure workflow 01 (20 min)

This is the only workflow you need to fully wire by hand. The other four follow the same pattern.

### 7.1 Import (n8n Cloud UI)

1. n8n Cloud → **Workflows → + Add → Import from File**.
2. Upload `n8n/workflows/01-daily-value-bet.json`.

You'll see 8 nodes. They're disconnected from credentials yet.

### 7.2 Wire credentials

Click each of these nodes and set the credential field:

- **OpenAI · Draft carousel** → Credentials → `openai-worldcup`.
- **Telegram · Manual review** → Credentials → `telegram-review`.

### 7.3 Wire the data source (most important — Code node references it)

The Code node "Compute value picks" references `$('Load teams').first().json.teams`. The "Load teams" node is currently a `readBinaryFile` stub. Replace it with an HTTP node that fetches from the public GitHub raw URL:

1. Delete the existing "Load teams" node.
2. Add a new **HTTP Request** node, place it before "Compute value picks", name it exactly `Load teams`.
3. URL: `https://raw.githubusercontent.com/ashleyhudson89/worldcup-viral/main/data/teams.json`
4. Method: `GET`. No auth needed since it's a public repo.
5. **Important**: connect both "Fetch odds (next 48hr)" AND "Load teams" → "Compute value picks". The Code node uses `$input.first()` for odds (main input) and `$('Load teams').first()` (cross-reference).

   Actually, simpler: just make "Load teams" the FIRST node after Schedule, then "Fetch odds" runs after it, then both feed into "Compute value picks" via two inputs. n8n's "Merge" node or just node chaining works here.

   Easiest layout:
   ```
   Schedule → Load teams → Fetch odds → Compute value picks → OpenAI → Render → Route → IG/Telegram
   ```
   In this layout, Compute references `$('Load teams').first().json` and `$input.first()` (which is the odds — its immediate predecessor).

### 7.4 Paste the OpenAI system prompt

Open the **OpenAI · Draft carousel** node:

1. Messages → System message: paste the entire **System** section from `prompts/value-bet.md`.
2. Messages → User message: leave as `={{ JSON.stringify($json) }}`.
3. Model: `gpt-4o-mini` (cheap and good enough for this — upgrade to `gpt-4o` if quality is lacking).
4. Tick **JSON output / response_format=json_object**.
5. Temperature: `0.4`.

### 7.5 Wire the IF router and Telegram node

The **Auto or manual?** node should already reference `{{$env.PUBLISH_MODE}}`. Since you set `PUBLISH_MODE=manual` in variables, all output routes to Telegram for now. Good.

Open **Telegram · Manual review** — confirm chat ID is `={{$env.TELEGRAM_CHAT_ID}}` and credentials = `telegram-review`.

### 7.6 Test fire

1. Click **Execute Workflow** (top-right).
2. Watch each node turn green.
3. Within 30 seconds, your Telegram bot should DM you a draft preview.

**If it fails**: click the red node, look at the error. Most common issues:
- Odds API returning empty (no WC matches in next 48hr — try editing the URL to `soccer_uefa_champs_league` or any active competition just to test the pipeline).
- OpenAI returning non-JSON (raise temperature down to 0.2, double-check `response_format=json_object` is ticked).
- Render service cold start timeout (the HTTP node default is 30s; bump to 60s in node options).

### 7.7 Save + Schedule

Save the workflow. Don't activate yet — leave `active: false` until Part 10.

---

## PART 8 — Build out workflows 02–05 (60 min)

Each one is a clone of 01 with different data fetching + different OpenAI prompt + different render template. Here's the per-workflow checklist:

### 8.1 `02-curse-stat-pre-match` (15 min)

1. Import `n8n/workflows/02-curse-stat-pre-match.json`.
2. Replace the "Select fixture + curse" Code node with this body (paste into the node's JS field):

```javascript
// Load curses.json + fixtures.json from public GitHub raw
// (or add two HTTP nodes upstream like in workflow 01).
const curses = $('Load curses').first().json.curses;
const fixtures = $('Load fixtures').first().json.fixtures;

const now = Date.now();
const sixHoursMs = 6 * 60 * 60 * 1000;
const windowMs = 30 * 60 * 1000;

// Find a fixture kicking off in 5.5–6.5 hours
const target = fixtures.find(f => {
  const kickoff = new Date(f.kickoff_utc).getTime();
  return Math.abs((kickoff - now) - sixHoursMs) < windowMs;
});
if (!target) return []; // no match → workflow ends quietly

// Pick a curse whose triggers match
function matches(curse, fixture) {
  const t = curse.triggers ?? {};
  if (t.involves_team && !t.involves_team.includes(fixture.home) && !t.involves_team.includes(fixture.away)) return false;
  if (t.round && !t.round.includes(fixture.round)) return false;
  if (t.matchday && fixture.matchday != null && !t.matchday.includes(fixture.matchday)) return false;
  return true;
}
const eligible = curses.filter(c => matches(c, target));
if (eligible.length === 0) return [];

const picked = eligible[Math.floor(Math.random() * eligible.length)];

return [{ json: { curse: picked, fixture: target } }];
```

3. Add upstream HTTP nodes "Load curses" + "Load fixtures" → raw GitHub URLs.
4. OpenAI node → paste system prompt from `prompts/curse-stat.md`.
5. Render node → JSON body `{ "template": "curse-stat", "slides": {{ JSON.stringify($json.slides) }} }`.
6. Rest is identical to workflow 01.
7. Test fire.

### 8.2 `03-pre-match-build-up` (15 min)

Same as 02 except:
- Fixture filter window = T-2h ± 15min instead of T-6h.
- Two parallel HTTP calls to Football-Data.org for home + away form (use credential `football-data`).
- OpenAI prompt = `prompts/pre-match.md`.
- Render template = `pre-match`.

Football-Data.org request shape:
```
GET https://api.football-data.org/v4/teams/{TEAM_ID}/matches?status=FINISHED&limit=5
Header: X-Auth-Token: <your token>  (handled by the credential)
```

You'll need a team-code → Football-Data-ID mapping. Add it to `data/teams.json` later as a `fd_id` field per team. For v1, hardcode the top 8 in the Code node:
```javascript
const FD_TEAM_IDS = { "ARG": 762, "BRA": 764, "FRA": 773, "ENG": 770, "ESP": 760, "GER": 759, "POR": 765, "NED": 766 };
```

### 8.3 `04-post-match-analysis` (15 min)

Different trigger pattern — polls for freshly-finished matches.

1. Schedule: every 5 min.
2. HTTP node: `GET https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED&dateFrom={today}`.
3. Code node "Dedupe":
```javascript
const data = $getWorkflowStaticData('global');
data.postedMatchIds = data.postedMatchIds || [];

const matches = $input.first().json.matches ?? [];
const fresh = matches.filter(m => {
  const finished = new Date(m.lastUpdated).getTime();
  const ageMin = (Date.now() - finished) / 60000;
  return ageMin < 30 && !data.postedMatchIds.includes(m.id);
});

for (const m of fresh) data.postedMatchIds.push(m.id);
return fresh.map(m => ({ json: m }));
```
4. OpenAI prompt = `prompts/post-match.md`. Render template = `post-match`.

### 8.4 `05-scandal-editorial` (15 min)

Webhook-triggered, NEVER auto-publish.

1. Import the workflow. The trigger is already `n8n-nodes-base.webhook` with path `/scandal`.
2. Note the production URL from the webhook node (something like `https://YOUR-N8N.cloud/webhook/scandal`).
3. OpenAI prompt = `prompts/scandal.md`. Render template = `scandal`.
4. **Confirm** the workflow has NO Instagram branch — only Telegram. If you accidentally wired one in, delete it.
5. To use: when you spot a news article you want to repackage, POST:
```bash
curl -X POST https://YOUR-N8N.cloud/webhook/scandal \
  -H 'Content-Type: application/json' \
  -d '{"team":"Nigeria","source_url":"https://example.com/article","fixture_context":"Plays Argentina in 48 hours"}'
```
6. The workflow extracts → drafts → Telegram review. You publish manually from your phone.

---

## PART 9 — Fill in `data/fixtures.json` with the real draw (20 min)

The committed file has only the 3 hosts seeded. You need the full 12 groups × 4 teams + the 104-match schedule.

### Where to get the official data

1. https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026 → "Match Schedule".
2. Alternative: https://www.football-data.org/v4/competitions/WC/matches?status=SCHEDULED with your token.

### The required schema (per fixture)

```json
{
  "id": "MATCH_001",
  "round": "group",
  "group": "A",
  "matchday": 1,
  "kickoff_utc": "2026-06-11T19:00:00Z",
  "venue": "Estadio Azteca, Mexico City",
  "home": "MEX",
  "away": "POL"
}
```

Round values: `"group"`, `"round_of_32"`, `"round_of_16"`, `"quarter"`, `"semi"`, `"3rd_place"`, `"final"`.

### Fastest workflow

Use Football-Data.org as the source of truth. One curl + jq:

```bash
curl -H "X-Auth-Token: $FOOTBALL_DATA_TOKEN" \
  "https://api.football-data.org/v4/competitions/WC/matches" \
  | jq '{
      tournament: {start:"2026-06-11", end:"2026-07-19", final_venue:"MetLife Stadium, East Rutherford"},
      fixtures: [.matches[] | {
        id: .id|tostring,
        round: (.stage|ascii_downcase),
        group: .group,
        matchday: .matchday,
        kickoff_utc: .utcDate,
        venue: .venue,
        home: .homeTeam.tla,
        away: .awayTeam.tla
      }]
    }' > data/fixtures.json
```

Then manually add the `_note` and `groups` sections back (copy from the committed stub). Or just append a `groups` block computed from the fixtures.

### Commit and push

```bash
cd ~/code/worldcup-viral
git add data/fixtures.json
git commit -m "Populate fixtures.json from FIFA/Football-Data 2026 draw"
git push
```

Now the n8n workflows fetching `raw.githubusercontent.com/.../data/fixtures.json` will see the real data on their next run.

---

## PART 10 — Go-live checklist (the moment of truth)

In order. Don't skip steps; each catches a different class of failure.

### 10.1 Manual fire each workflow in MANUAL mode (`PUBLISH_MODE=manual`)

```
[ ] 01-daily-value-bet  → Execute → Telegram draft arrives → caption reads cleanly
[ ] 02-curse-stat       → wait for next fixture in T-6h window OR temporarily widen the window in the Code node to "any fixture today" → Execute → draft arrives
[ ] 03-pre-match        → same — wait or widen window
[ ] 04-post-match       → if no WC match has finished yet, point the URL at a recent friendly comp temporarily to smoke-test
[ ] 05-scandal          → curl the webhook with a sample payload → Telegram draft arrives WITH review_notes
```

If all 5 produce sane Telegram previews, you're 90% done.

### 10.2 Soak test for 24 hours

Activate workflows 01–04 with `PUBLISH_MODE=manual`. Let them run on schedule for a day. Watch Telegram. You should see:
- 1 value-bet draft at 9am.
- N curse-stat / pre-match / post-match drafts as fixtures roll through.

If any draft has:
- A factually wrong stat → fix the source data (`data/curses.json` or the Code node logic).
- A weird tone → adjust the OpenAI prompt in the System message field.
- A broken image → check the Render service logs in Render.com dashboard.

### 10.3 Add the Instagram publish chain to workflow 01 (only when ready)

The committed `Instagram · Publish` node is a stub. To make it real, replace it with this 3-step sub-chain (add 3 sequential nodes in n8n):

**Step A — Upload each image as a child container**

Use a "Split In Batches" node (batch size 1) to iterate over `$('Render carousel').first().json.images`, then for each:

```
POST https://graph.facebook.com/v19.0/{{$env.IG_USER_ID}}/media
Body (form-urlencoded):
  image_url={{ a publicly-reachable URL for THIS image }}
  is_carousel_item=true
  access_token={{$env.IG_ACCESS_TOKEN}}
```

**Catch**: IG requires a public URL for `image_url`. You have two options:

**Option 1 (simplest, recommended)**: Modify the render service to upload PNGs to S3/R2/Cloudinary and return public URLs instead of base64. Cloudinary's free tier (25GB) is more than enough — sign up, get API key, add an upload step in `render-service/server.js` before returning. ~30 min of work.

**Option 2 (no extra service)**: Use Meta's resumable upload — POST the bytes directly. Sequence is documented at https://developers.facebook.com/docs/instagram-api/guides/content-publishing#resumable-uploads. ~1 hour of work.

For v1 with manual review you can defer this entirely — keep `PUBLISH_MODE=manual` and post from phone.

**Step B — Create the carousel container**

```
POST https://graph.facebook.com/v19.0/{{$env.IG_USER_ID}}/media
Body:
  media_type=CAROUSEL
  children={{ comma-joined child IDs from Step A }}
  caption={{ $('OpenAI · Draft carousel').first().json.caption }}
  access_token={{$env.IG_ACCESS_TOKEN}}
```

**Step C — Publish**

```
POST https://graph.facebook.com/v19.0/{{$env.IG_USER_ID}}/media_publish
Body:
  creation_id={{ carousel container ID from Step B }}
  access_token={{$env.IG_ACCESS_TOKEN}}
```

Returns the published media ID. Done.

### 10.4 Flip to auto (cautiously)

Once you've done 5+ successful manual publishes from Telegram → IG and you trust the format:

1. Set n8n variable `PUBLISH_MODE` → `auto`.
2. Activate workflow `01-daily-value-bet` (Active toggle, top-right).
3. Watch the first auto-publish hit IG. If it's clean, activate `02` next.
4. **Keep `05-scandal-editorial` manual forever.** Never automate publishing of editorial scandal content.

---

## Troubleshooting reference

### "Render service times out"
- Cold start on Render free tier is ~20–30s. Bump n8n HTTP node timeout to 60s.
- Or upgrade Render to $7/mo paid tier (no sleep).

### "OpenAI returns invalid JSON"
- Lower temperature to 0.2.
- Confirm `response_format: { type: "json_object" }` is set.
- Add `"Return ONLY valid JSON, no markdown fences."` as the last line of the system prompt.

### "Instagram returns OAuthException: code 190"
- Token expired. Re-run Part 5.4 to refresh the long-lived token.
- Long-lived Page tokens don't actually expire unless you change FB password, but USER tokens do. Make sure you're using the PAGE token (from `/me/accounts`), not the user token.

### "Football-Data.org returns 429"
- Free tier = 10 req/min. The post-match poll every 5min is fine. Don't add other heavy callers on the same token.

### "Telegram bot doesn't message me"
- Did you send `/start` to the bot from your account?
- Is `TELEGRAM_CHAT_ID` numeric (no quotes)?
- Run `https://api.telegram.org/bot<TOKEN>/getMe` to confirm token is valid.

### "Workflow runs but nothing appears in Telegram OR IG"
- Check n8n execution log → which node went red?
- Most common: Code node throwing on empty input — guard with `if (!$input.first()) return [];` at the top of every Code node.

---

## Files you will modify tomorrow

```
worldcup-viral/
├── data/fixtures.json              ← Part 9 (populate from FIFA/Football-Data)
├── n8n/workflows/01-...json        ← imported, wired in Part 7 (UI changes don't sync back to repo unless you re-export)
└── n8n/workflows/02-05...json      ← imported, wired in Part 8
```

Optional improvements you might add tomorrow if time:
- `render-service/server.js` ← add Cloudinary upload step (Part 10.3 Option 1)
- `data/teams.json` ← add `fd_id` field per team for Football-Data lookups
- `data/curses.json` ← add 5–10 more curses; current file has 9

---

## End-state when you're done

```
✅ New GitHub repo: ashleyhudson89/worldcup-viral
✅ Render service live at https://*.onrender.com, /health returns 200
✅ n8n Cloud has 5 workflows imported, credentialled, soak-tested in manual mode
✅ Instagram Business account linked, Meta App created, long-lived token saved
✅ fixtures.json populated with real 2026 draw
✅ Telegram receiving draft previews on schedule
✅ At least 1 manual publish completed end-to-end (Telegram → phone → IG)
🔲 Auto-publish flipped on (defer until you've watched 5+ manual successes)
🔲 Cloudinary or resumable-upload integration (defer until you flip to auto)
```

If you hit a blocker that this doc doesn't cover, the patterns are all in `README.md`, `n8n/README.md`, and `content-strategy.md`. Good luck.
