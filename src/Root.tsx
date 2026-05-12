import {Composition} from 'remotion';
import {TOTAL_FRAMES, VIDEO_CONFIG} from './constants';
import {PromoVideo} from './compositions/PromoVideo';
import {defaultVideoInput} from './types/video-input';

export const RemotionRoot = () => {
  return (
    <Composition
      id="PromoVideo"
      component={PromoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={VIDEO_CONFIG.fps}
      width={VIDEO_CONFIG.width}
      height={VIDEO_CONFIG.height}
      defaultProps={defaultVideoInput}
    />
  );
};
