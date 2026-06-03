import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CenteredTextBlock} from '../components/CenteredTextBlock';

type GrammarSentenceSceneProps = {
  sentence: string;
};

export const GrammarSentenceScene = ({sentence}: GrammarSentenceSceneProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const opacity = interpolate(frame, [0, 12, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const entryScale = interpolate(frame, [0, 14], [0.92, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const driftScale = interpolate(frame, [0, durationInFrames], [1, 1.06], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const y = interpolate(frame, [0, 20], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <CenteredTextBlock
      opacity={opacity}
      scale={entryScale * driftScale}
      translateY={y}
      maxWidth={980}
    >
      <div
        style={{
          background: 'rgba(9, 14, 24, 0.62)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: 36,
          padding: '54px 52px',
          backdropFilter: 'blur(3px)',
          boxShadow: '0 20px 48px rgba(2, 6, 14, 0.45)',
        }}
      >
        <div
          style={{
            fontSize: 88,
            lineHeight: 1.08,
            fontWeight: 700,
            letterSpacing: -1.8,
            color: '#f8fafc',
            textShadow: '0 10px 28px rgba(2, 6, 14, 0.7)',
          }}
        >
          {sentence}
        </div>
      </div>
    </CenteredTextBlock>
  );
};
