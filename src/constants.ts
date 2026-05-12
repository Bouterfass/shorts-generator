export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  introFrames: 90,
  screenFrames: 180,
  vocabularyFrames: 90,
  ctaFrames: 90,
  transitionFrames: 12,
} as const;

export const TOTAL_FRAMES =
  VIDEO_CONFIG.introFrames +
  VIDEO_CONFIG.screenFrames +
  VIDEO_CONFIG.vocabularyFrames +
  VIDEO_CONFIG.ctaFrames;
