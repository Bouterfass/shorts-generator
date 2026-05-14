import {Composition} from 'remotion';
import {getQuizDurationInFrames, TOTAL_FRAMES, VIDEO_CONFIG} from './constants';
import {PromoVideo} from './compositions/PromoVideo';
import {Quiz2ChoicesVideo} from './compositions/Quiz2ChoicesVideo';
import {defaultQuiz2ChoicesInput, defaultVideoInput} from './types/video-input';

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
    </>
  );
};
