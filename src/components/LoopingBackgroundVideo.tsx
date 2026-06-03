import {
  AbsoluteFill,
  interpolate,
  Loop,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {resolveAssetPath} from '../utils/assets';

type LoopingBackgroundVideoProps = {
  videoPath: string;
  blurPx?: number;
  overlayOpacity?: number;
};

export const LoopingBackgroundVideo = ({
  videoPath,
  blurPx = 3,
  overlayOpacity = 0.44,
}: LoopingBackgroundVideoProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1.04, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const shiftX = interpolate(frame, [0, durationInFrames], [0, -24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const shiftY = interpolate(frame, [0, durationInFrames], [0, -14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Loop durationInFrames={durationInFrames}>
        <AbsoluteFill
          style={{
            transform: `scale(${scale}) translate(${shiftX}px, ${shiftY}px)`,
            transformOrigin: 'center center',
          }}
        >
          <OffthreadVideo
            src={resolveAssetPath(videoPath)}
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: `blur(${blurPx}px)`,
            }}
          />
        </AbsoluteFill>
      </Loop>

      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(2, 6, 14, ${overlayOpacity - 0.1}) 0%, rgba(2, 6, 14, ${overlayOpacity + 0.08}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
