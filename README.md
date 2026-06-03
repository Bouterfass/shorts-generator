# Automated Shorts Generator (Remotion + React + TypeScript)

Generate vertical TikTok / YouTube Shorts videos from JSON.

Supported templates:
- `promo` (SaaS promo scenes)
- `quiz_2_choices` (interactive quiz)
- `grammar_mistake` / `spot_error` (Spot the grammar mistake)
- `vocabulary_list` (animated word -> translation list with TTS)

## 1) Setup

```bash
cd shorts-generator
npm install
```

## 2) Preview in Studio

```bash
npm run studio
```

Compositions available:
- `PromoVideo`
- `Quiz2ChoicesVideo`
- `GrammarMistakeVideo`
- `VocabularyListVideo`

## 3) Quick render commands

```bash
npm run render:example
npm run render:quiz
npm run render:grammar
npm run render:vocabulary
```

Custom render:

```bash
npm run render -- data/my-input.json out/my-video.mp4
```

Force a template explicitly:

```bash
npm run render -- data/my-input.json out/my-video.mp4 spot_error
```

Accepted template args:
- `auto` (default)
- `promo`
- `quiz_2_choices`
- `grammar_mistake`
- `spot_error`
- `vocabulary_list`

The render script auto-selects the composition when template arg is `auto`.

## 4) Local UI (paste JSON or drop file)

```bash
npm run dropzone
```

Open:

```txt
http://localhost:4321
```

Flow:
- Step 1: choose video type (`quiz_2_choices`, `vocabulary_list`, or `spot_error`)
- Step 2: choose a background preset when the template supports it
- Step 3: paste or import JSON, then validate it
- Step 4: generate the MP4 output

Output naming:
- The UI renders MP4 files from the video title slug.
- Example: `"title": "French Colors 🇫🇷"` becomes `french-colors.mp4`.
- If several videos have the same slug, the next files get a numeric suffix.
- `outputName` or `name` inside JSON still works as an explicit override.

The UI now supports:
- Single render (1 JSON object)
- Multi render with an array of objects
- Multi render with a batch wrapper object (`videos`)
- Download all rendered MP4 files from the results panel

Batch JSON format (recommended):

```json
{
  "defaultTemplate": "quiz_2_choices",
  "videos": [
    {
      "title": "Quiz 1",
      "questions": [
        {"word": "사랑", "choices": ["Love", "Food"], "correct": 0}
      ],
      "cta": "Learn while browsing"
    },
    {
      "template": "spot_error",
      "data": {
        "hook": "You're B2 if you can spot the mistake 👇",
        "sentence": "I am agree with you.",
        "cta": "Can you fix it?"
      }
    }
  ]
}
```

## Grammar mistake template

Template purpose: **"Spot the grammar mistake"** short videos.

Flow (15s total):
- `0-3s`: Hook emphasis
- `3-12s`: Sentence focus (no answer reveal)
- `12-15s`: CTA emphasis
- Top overlay is fixed to: `dailylearninghack`
- Optional language flag appears under `dailylearninghack` when `language` is provided

Background + audio defaults:
- `backgrounds/bgspoterror.mp4`
- `audio/chillsound.mp3`

Visual preset behavior in UI:
- `chat_background.mp4`: applied with **no extra audio** (video already has embedded sound)
- `bgspoterror.mp4`: applied with `audio/chillsound.mp3`

Example JSON:

```json
{
  "type": "grammar_mistake",
  "language": "fr",
  "hook": "You're B2 if you can spot the mistake 👇",
  "sentence": "I am agree with you.",
  "cta": "Can you fix it?",
  "backgroundVideoPath": "backgrounds/bgspoterror.mp4",
  "musicPath": "audio/chillsound.mp3"
}
```

Also supported:
- `"type": "spot_error"` (alias)
- If `title` is `spot_error`, the script also routes to this template.

## Vocabulary list template

Template purpose: animated list `word -> translation` with TTS sync.

Features:
- Framed animated title
- `@dailylearninghack` at the top
- Optional language flag under the brand
- Animated underline while each word/translation is spoken
- Background presets:
  - `carou1.jpg`

TTS notes:
- Generated automatically during render using macOS `say` + `afconvert`
- Audio files are cached in `public/audio/tts-cache`

Example JSON:

```json
{
  "type": "vocabulary_list",
  "title": "French Colors 🇫🇷",
  "difficulty": "beginner",
  "language": "french",
  "background": "carou1",
  "words": [
    {"word": "Rouge", "translation": "Red"},
    {"word": "Bleu", "translation": "Blue"},
    {"word": "Vert", "translation": "Green"}
  ],
  "cta": "Which word did you already know?"
}
```

## Promo template

Example file: `data/promo.example.json`

Required:
- `hookText`
- `promoVideoPath`
- `ctaText`

## Quiz template

Example file: `data/quiz.example.json`

Required:
- `type: "quiz_2_choices"`
- `title`
- `questions[]` with `word`, `choices` (2 items), `correct` (`0 | 1`)
- `cta`

## Project structure

```txt
shorts-generator/
├─ data/
│  ├─ promo.example.json
│  ├─ quiz.example.json
│  └─ grammar-spot-error.example.json
│  └─ vocabulary-list.example.json
├─ public/
│  ├─ audio/
│  ├─ backgrounds/
│  └─ videos/
├─ scripts/
│  ├─ render.ts
│  ├─ dropzone.ts
│  └─ dropzone-ui.html
├─ src/
│  ├─ components/
│  │  ├─ LoopingBackgroundVideo.tsx
│  │  └─ CenteredTextBlock.tsx
│  ├─ compositions/
│  │  ├─ PromoVideo.tsx
│  │  ├─ Quiz2ChoicesVideo.tsx
│  │  ├─ GrammarMistakeVideo.tsx
│  │  └─ VocabularyListVideo.tsx
│  ├─ scenes/
│  │  ├─ GrammarHookScene.tsx
│  │  ├─ GrammarSentenceScene.tsx
│  │  └─ GrammarCtaScene.tsx
│  ├─ types/video-input.ts
│  ├─ constants.ts
│  ├─ Root.tsx
│  └─ index.ts
└─ package.json
```
