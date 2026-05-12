import {AbsoluteFill, Sequence} from 'remotion';
import {VIDEO_CONFIG} from '../constants';
import {CtaScene} from '../scenes/CtaScene';
import {IntroHookScene} from '../scenes/IntroHookScene';
import {ScreenRecordingScene} from '../scenes/ScreenRecordingScene';
import {VocabularyScene} from '../scenes/VocabularyScene';
import {VideoInput} from '../types/video-input';

export const PromoVideo = (props: VideoInput) => {
  const {
    hookText,
    promoVideoPath,
    ctaText,
    vocabulary,
    captions,
    musicPath,
    brandName,
    accentColor,
  } = props;

  const introStart = 0;
  const screenStart = VIDEO_CONFIG.introFrames;
  const vocabularyStart = screenStart + VIDEO_CONFIG.screenFrames;
  const ctaStart = vocabularyStart + VIDEO_CONFIG.vocabularyFrames;

  return (
    <AbsoluteFill style={{backgroundColor: '#090d16'}}>
      <Sequence from={introStart} durationInFrames={VIDEO_CONFIG.introFrames}>
        <IntroHookScene
          hookText={hookText}
          brandName={brandName}
          accentColor={accentColor}
        />
      </Sequence>

      <Sequence from={screenStart} durationInFrames={VIDEO_CONFIG.screenFrames}>
        <ScreenRecordingScene
          promoVideoPath={promoVideoPath}
          musicPath={musicPath}
          captions={captions}
          accentColor={accentColor}
        />
      </Sequence>

      <Sequence
        from={vocabularyStart}
        durationInFrames={VIDEO_CONFIG.vocabularyFrames}
      >
        <VocabularyScene vocabulary={vocabulary} accentColor={accentColor} />
      </Sequence>

      <Sequence from={ctaStart} durationInFrames={VIDEO_CONFIG.ctaFrames}>
        <CtaScene
          ctaText={ctaText}
          brandName={brandName}
          accentColor={accentColor}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
