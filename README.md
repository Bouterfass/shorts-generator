# Automated Shorts Generator (Remotion + React + TypeScript)

This project generates **vertical videos (1080x1920)** from JSON.

Supported templates:
- `promo` (default): SaaS promo video with intro/demo/vocabulary/CTA
- `quiz_2_choices`: interactive-style quiz video for social media

## 1. Setup

```bash
cd shorts-generator
npm install
```

## 2. Preview in Remotion Studio

```bash
npm run studio
```

You will see:
- `PromoVideo`
- `Quiz2ChoicesVideo`

## 3. Render MP4 automatically

Promo example:

```bash
npm run render:example
```

Quiz example:

```bash
npm run render:quiz
```

Custom input/output:

```bash
npm run render -- data/my-input.json out/my-video.mp4
```

The render script auto-selects the composition from `input.type`.

## Promo template (`type: "promo"` or no type)

Example file: `data/promo.example.json`

Required fields:
- `hookText`
- `promoVideoPath`
- `ctaText`

Optional fields:
- `musicPath`
- `vocabulary`
- `captions`
- `brandName`
- `accentColor`

Media paths must reference files inside `public/`.
Example:
- `promoVideoPath: "videos/screen-recording.mp4"`
- `musicPath: "audio/music.mp3"`

## Quiz template (`type: "quiz_2_choices"`)

Example file: `data/quiz.example.json`

Required fields:
- `type`: `"quiz_2_choices"`
- `title`
- `questions` (array)
  - `word` (string)
  - `choices` (exactly 2 choices)
  - `correct` (`0` or `1`)
- `cta`

Optional fields:
- `accentColor`

Behavior:
- Title is pinned at the top for the whole video
- For each question:
  - Show: `Que veut dire {word} ?`
  - Show 2 choices horizontally
  - Wait 5 seconds
  - Highlight the correct choice in green

### Valid quiz JSON example

```json
{
  "type": "quiz_2_choices",
  "title": "Quiz JLPT N5",
  "questions": [
    {
      "word": "사랑",
      "choices": ["Love", "Food"],
      "correct": 0
    },
    {
      "word": "晚安",
      "choices": ["Good night", "Hello"],
      "correct": 0
    },
    {
      "word": "coeur",
      "choices": ["Heart", "Chair"],
      "correct": 0
    }
  ],
  "cta": "Learn while browsing"
}
```

## Project structure

```txt
shorts-generator/
├─ data/
│  ├─ promo.example.json
│  └─ quiz.example.json
├─ public/
│  ├─ audio/
│  └─ videos/
├─ scripts/
│  └─ render.ts
├─ src/
│  ├─ components/
│  ├─ compositions/
│  │  ├─ PromoVideo.tsx
│  │  └─ Quiz2ChoicesVideo.tsx
│  ├─ scenes/
│  │  ├─ QuizQuestionScene.tsx
│  │  └─ ...
│  ├─ types/
│  │  └─ video-input.ts
│  ├─ constants.ts
│  ├─ index.ts
│  └─ Root.tsx
├─ remotion.config.ts
├─ tsconfig.json
└─ package.json
```
