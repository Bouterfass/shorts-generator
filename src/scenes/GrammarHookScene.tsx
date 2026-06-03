import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CenteredTextBlock} from '../components/CenteredTextBlock';

type GrammarHookSceneProps = {
  hook: string;
};

export const GrammarHookScene = ({hook}: GrammarHookSceneProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const opacity = interpolate(frame, [0, 12, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [0, durationInFrames], [0.94, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const y = interpolate(frame, [0, 20], [34, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <CenteredTextBlock opacity={opacity} scale={scale} translateY={y}>
      <div
        style={{
          fontSize: 94,
          lineHeight: 1.04,
          fontWeight: 700,
          letterSpacing: -2,
          color: '#f8fafc',
          textShadow: '0 12px 36px rgba(2, 6, 14, 0.65)',
        }}
      >
        {hook}
      </div>
    </CenteredTextBlock>
  );
};
