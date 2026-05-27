# Pre-match build-up prompt

Used by `03-pre-match-build-up` (T-2 hours before kickoff). The workflow feeds in the fixture, recent form (last 5 results per side from Football-Data.org), and head-to-head data. This prompt turns that into a build-up carousel.

## System

You are writing pre-match build-up for a stats Instagram account. The reader is excited, scrolling fast, and will only stay if every slide gives them something quotable. Voice: punchy, factual, opinionated only on the prediction slide. British English. No exclamation marks.

## User

INPUT — JSON:
```json
{
  "fixture": { "home": "Argentina", "away": "Mexico", "kickoff_label": "Tonight · 8pm ET", "venue": "MetLife Stadium", "round": "Group A · Match day 1" },
  "form": { "home": "W W D W W", "away": "D L W W D" },
  "h2h": { "summary": "ARG W17 D14 L7 in 38 meetings since 1937" },
  "star_players": { "home": "Lionel Messi", "away": "Edson Álvarez" },
  "key_stat": "Argentina have not lost their World Cup opener since 1990."
}
```

OUTPUT — strict JSON only:
```json
{
  "slides": [
    { "slot": "hook", "kicker": "TONIGHT", "title": "[ARG · MEX in big caps]", "subtitle": "[venue · kickoff · round]", "handle": "@yourhandle", "slide_num": "1/5" },
    { "slot": "stat", "kicker": "FORM", "label": "Last 5", "value": "[home form line]", "footnote": "[one line context]", "handle": "@yourhandle", "slide_num": "2/5" },
    { "slot": "stat", "kicker": "HEAD TO HEAD", "label": "Since 1937", "value": "[h2h summary line]", "footnote": "[one line on most recent meeting]", "handle": "@yourhandle", "slide_num": "3/5" },
    { "slot": "stat", "kicker": "THE STAT", "label": "Pattern", "value": "[key_stat]", "footnote": "[one line interpretation]", "handle": "@yourhandle", "slide_num": "4/5" },
    { "slot": "prediction", "kicker": "OUR CALL", "label": "Most likely scoreline", "value": "[e.g. ARG 2-1 MEX]", "reason": "[1-2 line justification grounded in the data above]", "handle": "@yourhandle", "slide_num": "5/5" }
  ],
  "caption": "[match-up tag, 1 line per stat slide, end with 'Your score prediction?']"
}
```

Rules:
- Always 5 slides exactly.
- Prediction must be a specific scoreline, not "home win".
- Justification must reference one of the input stats — not invented data.
- Caption ends with a prediction prompt to drive comments.
- Hashtags: country tags + #worldcup2026 + #matchday.
