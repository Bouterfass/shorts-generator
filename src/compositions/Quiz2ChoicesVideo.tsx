import {AbsoluteFill, Sequence} from 'remotion';
import {
  getQuizQuestionDurationInFrames,
  QUIZ_CONFIG,
  VIDEO_CONFIG,
} from '../constants';
import {QuizQuestionScene} from '../scenes/QuizQuestionScene';
import {Quiz2ChoicesInput} from '../types/video-input';

export const Quiz2ChoicesVideo = ({
  title,
  questions,
  cta,
  accentColor,
}: Quiz2ChoicesInput) => {
  const questionDuration = getQuizQuestionDurationInFrames(VIDEO_CONFIG.fps);
  const revealAfterFrames = Math.floor(QUIZ_CONFIG.thinkSeconds * VIDEO_CONFIG.fps);

  return (
    <AbsoluteFill style={{backgroundColor: '#0a0e17'}}>
      {questions.map((question, index) => {
        const start = index * questionDuration;

        return (
          <Sequence
            key={`${question.word}-${index}`}
            from={start}
            durationInFrames={questionDuration}
          >
            <QuizQuestionScene
              question={question}
              title={title}
              cta={cta}
              accentColor={accentColor}
              revealAfterFrames={revealAfterFrames}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
