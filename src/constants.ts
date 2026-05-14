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

export const QUIZ_CONFIG = {
  thinkSeconds: 5,
  revealSeconds: 2,
} as const;

export const getQuizQuestionDurationInFrames = (
  fps = VIDEO_CONFIG.fps,
): number => {
  return Math.floor((QUIZ_CONFIG.thinkSeconds + QUIZ_CONFIG.revealSeconds) * fps);
};

export const getQuizDurationInFrames = (
  questionCount: number,
  fps = VIDEO_CONFIG.fps,
): number => {
  const safeQuestionCount = Math.max(1, questionCount);
  return safeQuestionCount * getQuizQuestionDurationInFrames(fps);
};
