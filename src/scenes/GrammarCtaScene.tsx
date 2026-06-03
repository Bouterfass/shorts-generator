import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CenteredTextBlock} from '../components/CenteredTextBlock';

type GrammarCtaSceneProps = {
  cta: string;
};

export const GrammarCtaScene = ({cta}: GrammarCtaSceneProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const opacity = interpolate(frame, [0, 10, durationInFrames], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [0, durationInFrames], [0.94, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const y = interpolate(frame, [0, 14], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <CenteredTextBlock opacity={opacity} scale={scale} translateY={y}>
      <div
        style={{
          fontSize: 96,
          lineHeight: 1.05,
          fontWeight: 700,
          letterSpacing: -2,
          color: '#f8fafc',
          textShadow: '0 12px 36px rgba(2, 6, 14, 0.68)',
        }}
      >
        {cta}
      </div>
    </CenteredTextBlock>
  );
};
