export type CaptionLine = {
  start: number;
  end: number;
  text: string;
};

export type PromoVideoInput = {
  type?: 'promo';
  hookText: string;
  promoVideoPath: string;
  ctaText: string;
  vocabulary: string[];
  captions?: CaptionLine[];
  musicPath?: string;
  brandName?: string;
  accentColor?: string;
};

export type QuizQuestion = {
  word: string;
  choices: [string, string];
  correct: 0 | 1;
};

export type Quiz2ChoicesInput = {
  type: 'quiz_2_choices';
  title: string;
  questions: QuizQuestion[];
  cta: string;
  accentColor?: string;
};

export type VideoInput = PromoVideoInput;

export type AnyVideoInput = PromoVideoInput | Quiz2ChoicesInput;

export const defaultVideoInput: PromoVideoInput = {
  type: 'promo',
  hookText: 'Make every webpage look clean in one click.',
  promoVideoPath: 'videos/screen-recording.mp4',
  ctaText: 'Install Background Picker on Chrome for free.',
  vocabulary: ['One-click themes', 'Clean focus mode', 'Save custom presets'],
  musicPath: 'audio/music.mp3',
  brandName: 'Background Picker',
  accentColor: '#6ee7ff',
  captions: [
    {start: 0.5, end: 2.3, text: 'Messy tabs turn into clean workspaces.'},
    {start: 3, end: 5.2, text: 'Preview themes instantly while you browse.'},
    {start: 5.4, end: 7.8, text: 'Save your favorite setups for every task.'},
    {start: 10.6, end: 12.4, text: 'Keep your focus without distracting pages.'},
    {start: 12.6, end: 14.6, text: 'Install now and transform your browser.'}
  ]
};

export const defaultQuiz2ChoicesInput: Quiz2ChoicesInput = {
  type: 'quiz_2_choices',
  title: 'Quiz JLPT N5',
  cta: 'Learn while browsing',
  accentColor: '#6ee7ff',
  questions: [
    {
      word: '사랑',
      choices: ['Love', 'Food'],
      correct: 0,
    },
    {
      word: '晚安',
      choices: ['Good night', 'Hello'],
      correct: 0,
    },
    {
      word: 'coeur',
      choices: ['Heart', 'Chair'],
      correct: 0,
    },
  ],
};
