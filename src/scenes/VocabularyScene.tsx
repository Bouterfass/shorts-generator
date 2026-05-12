import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneLayout} from '../components/SceneLayout';
import {fadeInOut} from '../utils/animations';

type VocabularySceneProps = {
  vocabulary: string[];
  accentColor?: string;
};

export const VocabularyScene = ({
  vocabulary,
  accentColor = '#6ee7ff',
}: VocabularySceneProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const opacity = fadeInOut(frame, 12, durationInFrames - 14, 14);

  return (
    <SceneLayout opacity={opacity}>
      <div
        style={{
          marginTop: 200,
          fontSize: 62,
          fontWeight: 700,
          letterSpacing: -1.5,
          lineHeight: 1.1,
          maxWidth: 900,
        }}
      >
        Core benefits users remember.
      </div>

      <div
        style={{
          marginTop: 60,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          maxWidth: 920,
        }}
      >
        {vocabulary.slice(0, 4).map((item, index) => {
          const progress = spring({
            frame: frame - 10 - index * 8,
            fps,
            config: {
              damping: 160,
              stiffness: 180,
              mass: 0.9,
            },
          });

          const y = interpolate(progress, [0, 1], [30, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const itemOpacity = interpolate(progress, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                border: `1px solid ${accentColor}4d`,
                borderRadius: 22,
                padding: '20px 26px',
                background: 'rgba(8, 13, 24, 0.68)',
                boxShadow: '0 14px 40px rgba(0,0,0,0.24)',
                transform: `translateY(${y}px)`,
                opacity: itemOpacity,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: accentColor,
                  boxShadow: `0 0 18px ${accentColor}`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 46,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </SceneLayout>
  );
};
