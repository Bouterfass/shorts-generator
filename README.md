# Automated Shorts Generator (Remotion + React + TypeScript)

This project generates **vertical short promo videos (1080x1920)** from a JSON file.

It includes reusable scenes for:
- Intro hook
- Screen recording
- Vocabulary/benefits
- CTA

It also supports:
- Dynamic text transitions
- Subtle zoom/pan motion
- Dark SaaS visual style
- Optional captions/subtitles
- Optional background music
- Automatic MP4 export

## 1. Setup

```bash
cd shorts-generator
npm install
```

## 2. Add your media

Put your files in:
- `public/videos/screen-recording.mp4`
- `public/audio/music.mp3` (optional)

You can use any file names, then reference them in your JSON input.

## 3. Edit JSON input

Use `data/promo.example.json` as your template.

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

## 4. Preview in Remotion Studio

```bash
npm run studio
```

## 5. Render MP4 automatically

Default example:

```bash
npm run render:example
```

Custom input and output:

```bash
npm run render -- data/my-video.json out/my-video.mp4
```

## JSON example

```json
{
  "hookText": "Stop browsing cluttered pages. Focus in one click.",
  "promoVideoPath": "videos/screen-recording.mp4",
  "musicPath": "audio/music.mp3",
  "ctaText": "Install Background Picker free on the Chrome Web Store.",
  "brandName": "Background Picker",
  "accentColor": "#6ee7ff",
  "vocabulary": [
    "One-click clean themes",
    "Distraction-free reading",
    "Save and reuse presets",
    "Fast browser performance"
  ],
  "captions": [
    {"start": 0.5, "end": 2.2, "text": "Pages feel cleaner instantly."},
    {"start": 3.1, "end": 5.0, "text": "Apply visual themes while browsing."}
  ]
}
```

## Project structure

```txt
shorts-generator/
├─ data/
│  └─ promo.example.json
├─ public/
│  ├─ audio/
│  └─ videos/
├─ scripts/
│  └─ render.ts
├─ src/
│  ├─ components/
│  │  ├─ AnimatedWords.tsx
│  │  ├─ CaptionTrack.tsx
│  │  └─ SceneLayout.tsx
│  ├─ compositions/
│  │  └─ PromoVideo.tsx
│  ├─ scenes/
│  │  ├─ CtaScene.tsx
│  │  ├─ IntroHookScene.tsx
│  │  ├─ ScreenRecordingScene.tsx
│  │  └─ VocabularyScene.tsx
│  ├─ types/
│  │  └─ video-input.ts
│  ├─ utils/
│  │  ├─ animations.ts
│  │  └─ assets.ts
│  ├─ constants.ts
│  ├─ index.ts
│  └─ Root.tsx
├─ remotion.config.ts
├─ tsconfig.json
└─ package.json
```
