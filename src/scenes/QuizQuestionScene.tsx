import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {QuizQuestion} from '../types/video-input';

type QuizQuestionSceneProps = {
  question: QuizQuestion;
  title: string;
  cta: string;
  accentColor?: string;
  revealAfterFrames: number;
};

export const QuizQuestionScene = ({
  question,
  title,
  cta,
  accentColor = '#6ee7ff',
  revealAfterFrames,
}: QuizQuestionSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const revealProgress = interpolate(
    frame,
    [revealAfterFrames, revealAfterFrames + 12],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const isRevealStarted = frame >= revealAfterFrames;

  const questionIn = spring({
    frame,
    fps,
    config: {
      damping: 160,
      stiffness: 180,
      mass: 0.9,
    },
  });

  const questionY = interpolate(questionIn, [0, 1], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const secondsLeft = Math.max(0, Math.ceil((revealAfterFrames - frame) / fps));

  return (
    <AbsoluteFill
      style={{
        color: '#0f172a',
        fontFamily: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
      }}
    >
      <Sequence from={0} durationInFrames={revealAfterFrames}>
        <Audio src={staticFile('audio/ticking_sound.mp3')} volume={0.5} />
      </Sequence>

      <Sequence from={revealAfterFrames} durationInFrames={Math.floor(2 * fps)}>
        <Audio src={staticFile('audio/good_answer.mp3')} volume={0.85} />
      </Sequence>

      <Img
        src={staticFile('backgrounds/bg_quiz2.jpeg')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(252, 254, 255, 0.34) 0%, rgba(243, 247, 255, 0.44) 60%, rgba(236, 242, 253, 0.55) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: '50%',
          transform: `translateY(calc(-50% + ${questionY}px))`,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            padding: '12px 30px',
            borderRadius: 999,
            border: '1px solid rgba(15, 23, 42, 0.14)',
            background: 'rgba(255, 255, 255, 0.78)',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: -0.8,
            textAlign: 'center',
            marginBottom: 6,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.1,
            color: '#0f172a',
            maxWidth: 940,
          }}
        >
          What does <span style={{color: '#0b4f6c'}}>{question.word}</span> mean?
        </div>

        <div
          style={{
            fontSize: 28,
            color: 'rgba(15, 23, 42, 0.72)',
            marginBottom: 4,
          }}
        >
          {isRevealStarted
            ? 'Correct answer'
            : `Answer reveals in ${secondsLeft}s`}
        </div>

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: 30,
          }}
        >
          {question.choices.map((choice, index) => {
            const shouldHighlight = isRevealStarted && index === question.correct;

            const borderColor = shouldHighlight
              ? `rgba(34, 197, 94, ${0.45 + revealProgress * 0.55})`
              : 'rgba(15, 23, 42, 0.22)';

            const background = shouldHighlight
              ? `linear-gradient(180deg, rgba(236, 253, 245, ${0.78 + revealProgress * 0.2}) 0%, rgba(220, 252, 231, ${0.82 + revealProgress * 0.18}) 100%)`
              : 'rgba(255, 255, 255, 0.82)';

            const shadow = shouldHighlight
              ? `0 0 ${12 + revealProgress * 20}px rgba(34, 197, 94, ${0.22 + revealProgress * 0.22})`
              : '0 10px 24px rgba(15, 23, 42, 0.08)';

            return (
              <div
                key={`${choice}-${index}`}
                style={{
                  width: 430,
                  height: 220,
                  borderRadius: 26,
                  border: `2px solid ${borderColor}`,
                  background,
                  boxShadow: shadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 22px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    lineHeight: 1.1,
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {choice}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          bottom: 60,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            borderRadius: 999,
            border: `1px solid ${accentColor}88`,
            background: 'rgba(255, 255, 255, 0.82)',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
            padding: '14px 28px',
            fontSize: 32,
            fontWeight: 600,
            color: '#0f172a',
            textAlign: 'center',
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
