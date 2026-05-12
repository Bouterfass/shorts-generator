import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneLayout} from '../components/SceneLayout';
import {fadeInOut} from '../utils/animations';

type CtaSceneProps = {
  ctaText: string;
  brandName?: string;
  accentColor?: string;
};

export const CtaScene = ({
  ctaText,
  brandName = 'Your Extension',
  accentColor = '#6ee7ff',
}: CtaSceneProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const opacity = fadeInOut(frame, 12, durationInFrames - 12, 12);

  const titleProgress = spring({
    frame,
    fps,
    config: {
      damping: 120,
      stiffness: 160,
      mass: 0.9,
    },
  });

  const titleY = interpolate(titleProgress, [0, 1], [36, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = 1 + Math.sin(frame / 8) * 0.01;

  return (
    <SceneLayout opacity={opacity}>
      <div
        style={{
          marginTop: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 34,
        }}
      >
        <div
          style={{
            fontSize: 72,
            maxWidth: 960,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.1,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {ctaText}
        </div>

        <div
          style={{
            borderRadius: 999,
            border: `1px solid ${accentColor}b3`,
            background: `linear-gradient(135deg, ${accentColor}22 0%, rgba(5, 9, 16, 0.7) 100%)`,
            padding: '18px 38px',
            fontSize: 36,
            fontWeight: 700,
            transform: `scale(${pulse})`,
            boxShadow: `0 12px 28px ${accentColor}40`,
          }}
        >
          Install Now
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 30,
            opacity: 0.82,
          }}
        >
          Available on Chrome Web Store · {brandName}
        </div>
      </div>
    </SceneLayout>
  );
};
