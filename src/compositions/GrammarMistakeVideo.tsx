import {AbsoluteFill, Audio} from 'remotion';
import {LoopingBackgroundVideo} from '../components/LoopingBackgroundVideo';
import {GrammarSpotErrorScene} from '../scenes/GrammarSpotErrorScene';
import {GrammarMistakeInput} from '../types/video-input';
import {resolveAssetPath} from '../utils/assets';

const BRAND_LABEL = 'dailylearninghack';

const LANGUAGE_FLAG_MAP: Record<string, string> = {
  ar: '🇸🇦',
  arabic: '🇸🇦',
  de: '🇩🇪',
  dutch: '🇳🇱',
  en: '🇬🇧',
  english: '🇬🇧',
  es: '🇪🇸',
  french: '🇫🇷',
  fr: '🇫🇷',
  german: '🇩🇪',
  hi: '🇮🇳',
  hindi: '🇮🇳',
  it: '🇮🇹',
  italian: '🇮🇹',
  ja: '🇯🇵',
  japanese: '🇯🇵',
  ko: '🇰🇷',
  korean: '🇰🇷',
  nl: '🇳🇱',
  portuguese: '🇵🇹',
  pt: '🇵🇹',
  russian: '🇷🇺',
  ru: '🇷🇺',
  spanish: '🇪🇸',
  tr: '🇹🇷',
  turkish: '🇹🇷',
  zh: '🇨🇳',
  chinese: '🇨🇳',
};

const countryCodeToFlag = (countryCode: string): string => {
  const chars = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(chars)) {
    return '';
  }

  return String.fromCodePoint(
    chars.charCodeAt(0) + 127397,
    chars.charCodeAt(1) + 127397,
  );
};

const resolveLanguageFlag = (language?: string): string => {
  if (!language) {
    return '';
  }

  const trimmed = language.trim();
  if (!trimmed) {
    return '';
  }

  if (/[\u{1F1E6}-\u{1F1FF}]{2}/u.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();
  if (LANGUAGE_FLAG_MAP[normalized]) {
    return LANGUAGE_FLAG_MAP[normalized];
  }

  const parts = normalized.split('-');
  if (parts.length > 1) {
    const countryFlag = countryCodeToFlag(parts[parts.length - 1]);
    if (countryFlag) {
      return countryFlag;
    }
  }

  return '';
};

export const GrammarMistakeVideo = ({
  language,
  hook,
  sentence,
  cta,
  backgroundVideoPath = 'backgrounds/bgspoterror.mp4',
  musicPath,
}: GrammarMistakeInput) => {
  const languageFlag = resolveLanguageFlag(language);

  return (
    <AbsoluteFill>
      <LoopingBackgroundVideo videoPath={backgroundVideoPath} blurPx={3.2} />
      {musicPath ? <Audio src={resolveAssetPath(musicPath)} volume={0.28} loop /> : null}

      <div
        style={{
          position: 'absolute',
          top: 168,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            color: 'rgba(248, 250, 252, 0.92)',
            fontSize: 28,
            letterSpacing: 1.2,
            fontWeight: 700,
            textTransform: 'lowercase',
            textShadow: '0 10px 26px rgba(2, 6, 14, 0.64)',
          }}
        >
          {BRAND_LABEL}
        </div>

        {languageFlag ? (
          <div
            style={{
              fontSize: 52,
              lineHeight: 1,
              textShadow: '0 8px 22px rgba(2, 6, 14, 0.62)',
            }}
          >
            {languageFlag}
          </div>
        ) : null}
      </div>

      <GrammarSpotErrorScene hook={hook} sentence={sentence} cta={cta} />
    </AbsoluteFill>
  );
};
