import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

type GrammarSpotErrorSceneProps = {
  hook: string;
  sentence: string;
  cta: string;
};

export const GrammarSpotErrorScene = ({
  hook,
  sentence,
  cta,
}: GrammarSpotErrorSceneProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const opacity = interpolate(frame, [0, 12, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const baseScale = interpolate(frame, [0, 16], [0.96, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const driftScale = interpolate(frame, [0, durationInFrames], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const y = interpolate(frame, [0, 18], [22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sentenceScale = interpolate(frame, [0, durationInFrames], [1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 980,
          paddingLeft: 60,
          paddingRight: 60,
          boxSizing: 'border-box',
          textAlign: 'center',
          transform: `translateY(${y}px) scale(${baseScale * driftScale})`,
          fontFamily: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            fontSize: 54,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: -1,
            textShadow: '0 12px 34px rgba(2, 6, 14, 0.66)',
          }}
        >
          {hook}
        </div>

        <div
          style={{
            marginTop: 34,
            marginBottom: 34,
            background: 'rgba(9, 14, 24, 0.62)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 34,
            padding: '46px 44px',
            backdropFilter: 'blur(3px)',
            boxShadow: '0 20px 48px rgba(2, 6, 14, 0.45)',
          }}
        >
          <div
            style={{
              fontSize: 90,
              lineHeight: 1.06,
              fontWeight: 700,
              letterSpacing: -1.8,
              transform: `scale(${sentenceScale})`,
              textShadow: '0 10px 28px rgba(2, 6, 14, 0.7)',
            }}
          >
            {sentence}
          </div>
        </div>

        <div
          style={{
            fontSize: 68,
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: -1.6,
            textShadow: '0 12px 36px rgba(2, 6, 14, 0.68)',
          }}
        >
          {cta}
        </div>
      </div>
    </div>
  );
};
