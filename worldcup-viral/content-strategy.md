# Content strategy — WC2026 Instagram

## The thesis

World Cup Instagram is **saturated** with the same four content types: lineup posts, generic memes, score graphics, and goal clips. Every federation, every club, every brand, every fan account does these. They get reach because of the topic, not because of the content.

To stand out, the wedge has to be something most accounts **can't** make: stats-driven, opinionated, slightly contrarian content with a consistent visual identity. That's what this project is built for.

The two content pillars below were chosen because they:
1. **Share well** (people screenshot and DM them — IG's strongest organic signal).
2. **Drive comments** (binary takes and predictions both bait reply chains, which the algorithm boosts).
3. **Scale with automation** (the data lives in spreadsheets / APIs, the format is a fixed template).
4. **Are defensible** (you can defend a stat with a source; you can't defend a generic meme).

## Pillar 1 — Value bets & outsider odds

**Why it travels**: bettors screenshot picks to send to mates. Even non-bettors share "lol this stat is mad" picks. It's the highest-share format on football IG aside from goals.

**The format**: 7-slide carousel — 1 hook, up to 5 picks, 1 CTA. Each pick = a team, a market, the odds, and a 1-line "why" grounded in the Elo-vs-implied-probability gap.

**Volume**: 1 post/day at 9am during the tournament. Don't post more — value picks lose credibility when they appear daily AND multiple times daily.

**Risk**: regulated content. Always include "18+ only. Not financial advice. begambleaware.org" in the caption. Don't tag bookmakers directly. Avoid the word "guaranteed".

## Pillar 2 — Curse / streak stats

**Why it travels**: pattern-matching superstition is universal. "Every team that won match 1 of group X also won the group" is the kind of thing that gets sent in WhatsApp groups for the full tournament.

**The format**: 5–7 slide carousel — 1 hook with the curse line, 3–5 body slides each citing one historical instance, 1 sign-off slide tying it to the upcoming match.

**Volume**: 1 post per fixture at T-6h. With 104 matches across 5.5 weeks that's ~3 posts/day at peak, dropping to 1/day in the knockout rounds.

**Risk**: low. The hard part is keeping `data/curses.json` factually correct. **Every** new curse you add needs a source link in a comment — a stat without a source is a viral correction waiting to happen.

## Supporting threads

### Pre-match build-up (T-2h)
- 5-slide carousel: matchup card → home form → H2H → key stat → predicted scoreline.
- Comment-driver: "your scoreline prediction?" hardcoded into every caption.
- ~3/day at group stage peak.

### Post-match analysis (FT+15min)
- 5-slide carousel: score → xG → shots → context stat → spicy take.
- The take slide is what differentiates from every other account.
- ~3/day at group stage peak.
- Timing matters: the algorithm rewards posts in the 15–30min window after FT when match traffic peaks.

### Scandal / drama (manual, ad-hoc)
- 4-slide carousel: hook → what we know → federation response → open question.
- Manual trigger only. Never auto-publish.
- 10–20% of total volume max — more and you tip from "smart account" into "tabloid".
- Always frame as questions, never claims. Always cite source by name in the slide text.

## Posting cadence at peak

```
09:00  Daily value bet     (auto)
T-6h   Curse stat × N      (per fixture — usually 3 matches/day at group stage)
T-2h   Pre-match × N       (per fixture)
FT+15  Post-match × N      (per fixture)
Ad-hoc Scandal             (manual, max 1/day)
```

At group-stage peak: ~10–12 posts/day across 3 matches. That's a lot. **Use IG's archive on lower-performing posts** so the grid doesn't visually collapse. The feed-vs-grid distinction matters here — feed is where reach lives, grid is where credibility lives.

## Bio + first impressions

Whoever lands on your profile after seeing a viral carousel decides in 3 seconds whether to follow. They look at:

1. **Profile picture**: high contrast, recognisable at 24px. Black background, electric green wordmark.
2. **Bio**: ≤ 150 chars. Suggested: "Stats-led football. Daily value picks · pre-match · curse stats. WC2026 → and beyond. Not financial advice."
3. **First 9 grid posts**: the most-recent 9 are visible without scrolling. Make sure 3 of those 9 are your strongest curse stats — they're your highest-shareability format and they signal "this account is different".

## Engagement playbook

- **Reply to every comment in the first hour** of every post. The algorithm reads this as engagement quality, not just engagement quantity.
- **Pin one comment per post** that re-asks the binary question. Triples the comment reply rate.
- **Repost screenshots of your posts** to your story when they get screenshot-shared in the wild. Signals reach to followers, drives new follows from their followers.
- **Don't reply to bot/troll comments**. Don't argue with people about your picks losing. The picks won't all win — the format wins.

## What NOT to do

- Don't try to compete with @433 or @goal on goal clips and breaking news. They have hundreds of staff and FIFA licensing deals. You can't and don't need to.
- Don't post AI-generated player images. The detector accounts are ruthless and you'll lose credibility instantly.
- Don't run giveaways pre-tournament. They attract bots, not fans, and IG suppresses engagement on accounts with high inactive-follower ratios.
- Don't post in 9 languages. Pick one (English) and own it. Multi-language posts halve reach in every language.

## Metrics that matter

Track weekly:
- **Saves per follower** — best signal of share-worthiness.
- **Comment depth** (replies per top-level comment) — best signal of true engagement.
- **Profile-visit-to-follow rate** — signal that your bio + grid are working.
- **Reach-from-non-followers ratio** — signal that the algorithm is amplifying you.

Don't chase: follower count (vanity), like count (cheap), story views (decoupled from feed performance).

## Honest expectations

A new IG account in a saturated vertical, even with strong content, takes **3–4 weeks of consistent posting** to start seeing meaningful algorithmic lift. The tournament is 5.5 weeks. You're in a race against the tournament ending.

To accelerate: collab posts. DM 5–10 mid-sized football accounts and offer to ghost-make a value-bet carousel for their feed, credit them, link to you in the caption. Each collab is worth ~weeks of organic growth.

The wedge isn't speed. It's having a content format nobody else has the data pipeline to make.
