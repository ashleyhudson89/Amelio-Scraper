# n8n setup

Five workflows live in `workflows/`. They share one architecture:

```
Schedule trigger → Fetch data → Code (transform) → OpenAI (draft slides JSON)
                                                      ↓
                                       Render service (HTML → PNG carousel)
                                                      ↓
                                            IF auto/manual? → IG Graph API
                                                            → Telegram (manual queue)
```

## Order to set up

1. **`01-daily-value-bet.json`** — the canonical, fully-fleshed-out workflow. Import this first, get it working end-to-end, then duplicate the pattern for the others.
2. **`02-curse-stat-pre-match.json`** — same shape, different data input + template + prompt. Skeleton provided; fill in the Code node logic referencing `data/curses.json`.
3. **`03-pre-match-build-up.json`** — adds two parallel HTTP calls (home form + away form). Skeleton provided.
4. **`04-post-match-analysis.json`** — polls Football-Data.org for finished matches, dedupes against n8n static data. Skeleton provided.
5. **`05-scandal-editorial.json`** — manual webhook trigger, ALWAYS routes to Telegram for review. Never enable auto-publish on this one.

## Credentials to configure in n8n Cloud

| Credential | Used by | How to get it |
|---|---|---|
| OpenAI API key | All five workflows | platform.openai.com → API keys |
| The Odds API key | `01-daily-value-bet` | the-odds-api.com → 500 req/month free tier |
| Football-Data.org token | `03`, `04` | football-data.org/client/register → free tier |
| Instagram Graph API access token | All five (auto branch) | See "Instagram setup" below |
| Telegram bot token + chat ID | All five (manual branch) | @BotFather → /newbot, then send the bot any message and use https://api.telegram.org/bot{TOKEN}/getUpdates to find your chat ID |

## Environment variables to set in n8n Cloud

```
RENDER_SERVICE_URL=https://your-render-service.onrender.com
RENDER_AUTH_TOKEN=<must match the value you deployed the render service with>
PUBLISH_MODE=manual          # change to 'auto' once you trust the pipeline
IG_USER_ID=<your IG Business account ID>
IG_ACCESS_TOKEN=<long-lived page access token>
TELEGRAM_CHAT_ID=<your chat ID>
```

## Instagram setup (the painful part)

Instagram's API publishing requires a chain of setup that's easy to get wrong. In order:

1. Your IG account must be a **Business** or **Creator** account.
2. It must be linked to a **Facebook Page** (Meta requirement — yes, in 2026).
3. Create a **Meta Developer App** at developers.facebook.com → add "Instagram Graph API" and "Facebook Login for Business" products.
4. Generate a User Access Token via Graph Explorer → exchange it for a **long-lived Page Access Token** (60-day expiry, refreshable).
5. Find your **IG User ID** via `GET /me/accounts` → look at the `instagram_business_account.id` field on your Page.
6. To publish a carousel, the actual API sequence is:
   - For each image: `POST /{IG_USER_ID}/media` with `image_url` (or use Meta's resumable upload) → returns a child container ID.
   - `POST /{IG_USER_ID}/media` with `media_type=CAROUSEL` + `children=<comma-separated child IDs>` → returns the carousel container ID.
   - `POST /{IG_USER_ID}/media_publish` with `creation_id=<carousel container ID>` → publishes.

The `Instagram · Publish` node in the workflow is a **stub**. Replace it with these three sequential HTTP calls. Easiest pattern: a Code node that loops over the images array, then a final HTTP call to publish.

You also need the images at a publicly reachable URL for the simpler `image_url` upload path. Options:
- Upload to S3/R2 from the render service and return URLs (cleanest).
- Have the render service return base64 and use Meta's resumable upload (no public hosting, more setup).

Start in **manual mode** (Telegram). Only flip to auto once you've watched 10–20 manual posts and trust both the draft quality and the publishing chain.

## Tips

- Workflows are imported one-at-a-time via n8n's "Import from File" in the top-right menu.
- The Code nodes reference `$('Load teams').first().json` etc. — your other nodes must match those exact names or update the references.
- n8n Cloud's free tier has execution limits — the post-match workflow polling every 5 min during the tournament will consume them quickly. Consider upping the polling interval to 10–15 min, or moving to self-hosted for the tournament window.
- Set every workflow to `active: false` initially. Test by manually clicking "Execute workflow" before activating the schedule.
