import {useCurrentFrame, useVideoConfig} from 'remotion';
import {AnimatedWords} from '../components/AnimatedWords';
import {SceneLayout} from '../components/SceneLayout';
import {fadeInOut, slideUp} from '../utils/animations';

type IntroHookSceneProps = {
  hookText: string;
  brandName?: string;
  accentColor?: string;
};

export const IntroHookScene = ({
  hookText,
  brandName = 'Your Extension',
  accentColor = '#6ee7ff',
}: IntroHookSceneProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const opacity = fadeInOut(frame, 16, durationInFrames - 18, 18);
  const y = slideUp(frame, 0, 20, 60);
  return (
    <SceneLayout opacity={opacity}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 80% 25%, rgba(110, 231, 255, 0.18), transparent 40%)',
        }}
      />

      <div
        style={{
          marginTop: 180,
          transform: `translateY(${y}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 999,
            border: `1px solid ${accentColor}99`,
            padding: '10px 18px',
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 48,
            background: 'rgba(6, 10, 20, 0.6)',
          }}
        >
          {brandName}
        </div>

        <AnimatedWords text={hookText} />

        <p
          style={{
            marginTop: 34,
            marginBottom: 0,
            fontSize: 34,
            opacity: 0.82,
            maxWidth: 860,
            lineHeight: 1.3,
          }}
        >
          Clean visuals, faster focus, better browsing flow.
        </p>
      </div>
    </SceneLayout>
  );
};
