import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

type AnimatedWordsProps = {
  text: string;
  delayPerWord?: number;
  fontSize?: number;
};

export const AnimatedWords = ({
  text,
  delayPerWord = 5,
  fontSize = 92,
}: AnimatedWordsProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        fontSize,
        lineHeight: 1.05,
        fontWeight: 700,
        letterSpacing: -2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      {text.split(' ').map((word, index) => {
        const progress = spring({
          frame: frame - index * delayPerWord,
          fps,
          config: {
            damping: 200,
            stiffness: 160,
            mass: 0.9,
          },
        });

        const opacity = interpolate(progress, [0, 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const y = interpolate(progress, [0, 1], [42, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <span
            key={`${word}-${index}`}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
