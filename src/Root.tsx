import {Composition} from 'remotion';
import {
  getGrammarMistakeDurationInFrames,
  getQuizDurationInFrames,
  getVocabularyListDurationInFrames,
  TOTAL_FRAMES,
  VIDEO_CONFIG,
} from './constants';
import {GrammarMistakeVideo} from './compositions/GrammarMistakeVideo';
import {PromoVideo} from './compositions/PromoVideo';
import {Quiz2ChoicesVideo} from './compositions/Quiz2ChoicesVideo';
import {VocabularyListVideo} from './compositions/VocabularyListVideo';
import {
  defaultGrammarMistakeInput,
  defaultQuiz2ChoicesInput,
  defaultVideoInput,
  defaultVocabularyListInput,
} from './types/video-input';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={defaultVideoInput}
      />

      <Composition
        id="Quiz2ChoicesVideo"
        component={Quiz2ChoicesVideo}
        durationInFrames={getQuizDurationInFrames(
          defaultQuiz2ChoicesInput.questions.length,
          VIDEO_CONFIG.fps,
        )}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={defaultQuiz2ChoicesInput}
        calculateMetadata={({props}) => {
          return {
            durationInFrames: getQuizDurationInFrames(
              props.questions.length,
              VIDEO_CONFIG.fps,
            ),
          };
        }}
      />

      <Composition
        id="GrammarMistakeVideo"
        component={GrammarMistakeVideo}
        durationInFrames={getGrammarMistakeDurationInFrames(VIDEO_CONFIG.fps)}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={defaultGrammarMistakeInput}
      />

      <Composition
        id="VocabularyListVideo"
        component={VocabularyListVideo}
        durationInFrames={getVocabularyListDurationInFrames(
          defaultVocabularyListInput.words.length,
          VIDEO_CONFIG.fps,
        )}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={defaultVocabularyListInput}
        calculateMetadata={({props}) => {
          return {
            durationInFrames: getVocabularyListDurationInFrames(
              props.words.length,
              VIDEO_CONFIG.fps,
            ),
          };
        }}
      />
    </>
  );
};
