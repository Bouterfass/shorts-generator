import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {CaptionTrack} from '../components/CaptionTrack';
import {SceneLayout} from '../components/SceneLayout';
import {CaptionLine} from '../types/video-input';
import {resolveAssetPath} from '../utils/assets';
import {fadeInOut} from '../utils/animations';

type ScreenRecordingSceneProps = {
  promoVideoPath: string;
  musicPath?: string;
  captions?: CaptionLine[];
  accentColor?: string;
};

export const ScreenRecordingScene = ({
  promoVideoPath,
  musicPath,
  captions,
  accentColor = '#6ee7ff',
}: ScreenRecordingSceneProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const opacity = fadeInOut(frame, 16, durationInFrames - 20, 20);
  const zoom = interpolate(frame, [0, durationInFrames], [1.02, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shiftX = interpolate(frame, [0, durationInFrames], [0, -70], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shiftY = interpolate(frame, [0, durationInFrames], [0, -50], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneLayout opacity={opacity}>
      {musicPath ? <Audio src={resolveAssetPath(musicPath)} volume={0.2} /> : null}

      <div
        style={{
          marginTop: 96,
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 999,
          border: `1px solid ${accentColor}88`,
          background: 'rgba(5, 8, 14, 0.65)',
          padding: '8px 18px',
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Live Product Demo
      </div>

      <div
        style={{
          marginTop: 34,
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: -2,
          lineHeight: 1.08,
          maxWidth: 900,
        }}
      >
        Watch the extension transform your tab in real time.
      </div>

      <div
        style={{
          marginTop: 56,
          borderRadius: 36,
          overflow: 'hidden',
          border: `1px solid ${accentColor}4d`,
          width: 920,
          height: 880,
          background: '#02050d',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          position: 'relative',
        }}
      >
        <AbsoluteFill
          style={{
            transform: `scale(${zoom}) translate(${shiftX}px, ${shiftY}px)`,
            transformOrigin: 'center center',
          }}
        >
          <OffthreadVideo
            src={resolveAssetPath(promoVideoPath)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </AbsoluteFill>

        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(2, 5, 13, 0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <CaptionTrack captions={captions} accentColor={accentColor} />
    </SceneLayout>
  );
};
