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
  fps: number = VIDEO_CONFIG.fps,
): number => {
  return Math.floor((QUIZ_CONFIG.thinkSeconds + QUIZ_CONFIG.revealSeconds) * fps);
};

export const getQuizDurationInFrames = (
  questionCount: number,
  fps: number = VIDEO_CONFIG.fps,
): number => {
  const safeQuestionCount = Math.max(1, questionCount);
  return safeQuestionCount * getQuizQuestionDurationInFrames(fps);
};

export const GRAMMAR_MISTAKE_CONFIG = {
  durationSeconds: 15,
  introSeconds: 3,
  sentenceSeconds: 9,
  ctaSeconds: 3,
} as const;

export const getGrammarMistakeDurationInFrames = (
  fps: number = VIDEO_CONFIG.fps,
): number => {
  return Math.floor(GRAMMAR_MISTAKE_CONFIG.durationSeconds * fps);
};

export const getGrammarMistakeIntroFrames = (
  fps: number = VIDEO_CONFIG.fps,
): number => {
  return Math.floor(GRAMMAR_MISTAKE_CONFIG.introSeconds * fps);
};

export const getGrammarMistakeSentenceFrames = (
  fps: number = VIDEO_CONFIG.fps,
): number => {
  return Math.floor(GRAMMAR_MISTAKE_CONFIG.sentenceSeconds * fps);
};

export const getGrammarMistakeCtaFrames = (
  fps: number = VIDEO_CONFIG.fps,
): number => {
  return Math.floor(GRAMMAR_MISTAKE_CONFIG.ctaSeconds * fps);
};

export const VOCABULARY_LIST_CONFIG = {
  introSeconds: 2.2,
  wordSpeakSeconds: 1.05,
  betweenWordAndTranslationSeconds: 0.7,
  translationSpeakSeconds: 1.05,
  postTranslationPauseSeconds: 0.35,
  ctaSeconds: 0,
} as const;

export const getVocabularyListRowDurationInFrames = (
  fps: number = VIDEO_CONFIG.fps,
): number => {
  const totalSeconds =
    VOCABULARY_LIST_CONFIG.wordSpeakSeconds +
    VOCABULARY_LIST_CONFIG.betweenWordAndTranslationSeconds +
    VOCABULARY_LIST_CONFIG.translationSpeakSeconds +
    VOCABULARY_LIST_CONFIG.postTranslationPauseSeconds;

  return Math.floor(totalSeconds * fps);
};

export const getVocabularyListIntroFrames = (
  fps: number = VIDEO_CONFIG.fps,
): number => {
  return Math.floor(VOCABULARY_LIST_CONFIG.introSeconds * fps);
};

export const getVocabularyListCtaFrames = (
  fps: number = VIDEO_CONFIG.fps,
): number => {
  return Math.floor(VOCABULARY_LIST_CONFIG.ctaSeconds * fps);
};

export const getVocabularyListDurationInFrames = (
  wordCount: number,
  fps: number = VIDEO_CONFIG.fps,
): number => {
  const safeWordCount = Math.max(1, wordCount);
  return (
    getVocabularyListIntroFrames(fps) +
    safeWordCount * getVocabularyListRowDurationInFrames(fps) +
    getVocabularyListCtaFrames(fps)
  );
};
