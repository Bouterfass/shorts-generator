import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CaptionLine} from '../types/video-input';

type CaptionTrackProps = {
  captions?: CaptionLine[];
  accentColor?: string;
};

export const CaptionTrack = ({
  captions,
  accentColor = '#6ee7ff',
}: CaptionTrackProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (!captions || captions.length === 0) {
    return null;
  }

  const now = frame / fps;
  const activeCaption = captions.find(
    (caption) => now >= caption.start && now <= caption.end,
  );

  if (!activeCaption) {
    return null;
  }

  const startFrame = Math.floor(activeCaption.start * fps);
  const pop = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 200,
      mass: 0.9,
    },
  });

  const translateY = interpolate(pop, [0, 1], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(pop, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 90,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          color: '#ffffff',
          fontSize: 44,
          lineHeight: 1.2,
          textAlign: 'center',
          fontWeight: 700,
          padding: '18px 28px',
          borderRadius: 20,
          border: `1px solid ${accentColor}66`,
          background: 'rgba(6, 10, 20, 0.78)',
          boxShadow: `0 14px 40px ${accentColor}22`,
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {activeCaption.text}
      </div>
    </div>
  );
};
