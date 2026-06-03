import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  getVocabularyListIntroFrames,
  getVocabularyListRowDurationInFrames,
  VOCABULARY_LIST_CONFIG,
} from '../constants';
import {VocabularyListInput} from '../types/video-input';
import {resolveAssetPath} from '../utils/assets';

const BRAND_HANDLE = '@dailylearninghack';

const LANGUAGE_FLAG_MAP: Record<string, string> = {
  arabic: '🇸🇦',
  ar: '🇸🇦',
  english: '🇬🇧',
  en: '🇬🇧',
  french: '🇫🇷',
  fr: '🇫🇷',
  german: '🇩🇪',
  de: '🇩🇪',
  italian: '🇮🇹',
  it: '🇮🇹',
  japanese: '🇯🇵',
  ja: '🇯🇵',
  korean: '🇰🇷',
  ko: '🇰🇷',
  portuguese: '🇵🇹',
  pt: '🇵🇹',
  spanish: '🇪🇸',
  es: '🇪🇸',
  turkish: '🇹🇷',
  tr: '🇹🇷',
};

const getLanguageFlag = (language?: string): string => {
  if (!language) {
    return '';
  }

  const normalized = language.trim().toLowerCase();
  return LANGUAGE_FLAG_MAP[normalized] ?? '';
};

export const VocabularyListVideo = ({
  title,
  difficulty,
  language,
  words,
  background = 'carou1',
  backgroundImagePath,
  voiceSegments = [],
}: VocabularyListInput) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();

  const introFrames = getVocabularyListIntroFrames(fps);
  const rowDurationFrames = getVocabularyListRowDurationInFrames(fps);

  const wordSpeakFrames = Math.floor(VOCABULARY_LIST_CONFIG.wordSpeakSeconds * fps);
  const betweenFrames = Math.floor(
    VOCABULARY_LIST_CONFIG.betweenWordAndTranslationSeconds * fps,
  );
  const translationSpeakFrames = Math.floor(
    VOCABULARY_LIST_CONFIG.translationSpeakSeconds * fps,
  );

  const isDark =
    background === 'carou2' ||
    (backgroundImagePath ?? '').toLowerCase().includes('carou2');

  const safeText = isDark ? '#f8fafc' : '#13213a';
  const softText = isDark ? '#d8e4f9' : '#3b4f73';
  const activeColor = isDark ? '#fde68a' : '#7c3aed';
  const cardBg = isDark
    ? 'rgba(5, 10, 20, 0.58)'
    : 'rgba(255, 255, 255, 0.72)';

  const flag = getLanguageFlag(language);
  const backgroundSrc = resolveAssetPath(
    backgroundImagePath ||
      (background === 'carou2' ? 'backgrounds/carou2.jpg' : 'backgrounds/carou1.jpg'),
  );

  const titlePop = spring({
    frame,
    fps,
    config: {
      damping: 16,
      stiffness: 120,
      mass: 0.8,
    },
  });

  const titleOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgScale = interpolate(frame, [0, durationInFrames], [1.04, 1.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgShiftX = interpolate(frame, [0, durationInFrames], [0, -34], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgShiftY = interpolate(frame, [0, durationInFrames], [0, -20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const shimmer = interpolate(
    frame % 90,
    [0, 45, 90],
    [0.35, 1, 0.35],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const rowFontSize = words.length >= 8 ? 34 : words.length >= 6 ? 38 : 42;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale}) translate(${bgShiftX}px, ${bgShiftY}px)`,
          transformOrigin: 'center',
        }}
      >
        <Img
          src={backgroundSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isDark ? 'blur(1px) saturate(0.88)' : 'blur(0.5px) saturate(0.9)',
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(4, 8, 18, 0.42) 0%, rgba(4, 8, 18, 0.72) 100%)'
            : 'linear-gradient(180deg, rgba(252, 244, 232, 0.58) 0%, rgba(245, 236, 226, 0.78) 100%)',
        }}
      />

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 14% 15%, rgba(168, 85, 247, 0.22), transparent 35%), radial-gradient(circle at 82% 72%, rgba(14, 165, 233, 0.24), transparent 40%)',
          mixBlendMode: isDark ? 'screen' : 'multiply',
        }}
      />

      <AbsoluteFill
        style={{
          paddingLeft: 112,
          paddingRight: 112,
          paddingTop: 154,
          paddingBottom: 126,
          boxSizing: 'border-box',
          color: safeText,
          fontFamily: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${isDark ? 'rgba(248,250,252,0.3)' : 'rgba(19,33,58,0.22)'}`,
              background: isDark ? 'rgba(7, 13, 24, 0.42)' : 'rgba(255, 255, 255, 0.45)',
              fontWeight: 700,
              letterSpacing: 0.5,
              fontSize: 24,
            }}
          >
            {BRAND_HANDLE}
          </div>
          {flag ? (
            <div style={{fontSize: 34, lineHeight: 1, filter: 'drop-shadow(0 6px 10px rgba(2, 6, 14, 0.3))'}}>
              {flag}
            </div>
          ) : null}
        </div>

        <div
          style={{
            alignSelf: 'center',
            margin: '0 auto',
            width: '100%',
            maxWidth: 840,
            borderRadius: 30,
            border: `2px solid ${isDark ? 'rgba(248,250,252,0.4)' : 'rgba(15,23,42,0.25)'}`,
            background: isDark ? 'rgba(8, 12, 24, 0.52)' : 'rgba(255,255,255,0.54)',
            boxShadow: isDark
              ? `0 14px 34px rgba(2, 6, 14, 0.55), 0 0 0 2px rgba(250, 204, 21, ${0.12 * shimmer}) inset`
              : `0 14px 34px rgba(30, 41, 59, 0.2), 0 0 0 2px rgba(124, 58, 237, ${0.1 * shimmer}) inset`,
            padding: '26px 30px',
            opacity: titleOpacity,
            transform: `scale(${0.92 + titlePop * 0.08})`,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.8,
              textAlign: 'center',
              textShadow: isDark
                ? '0 12px 30px rgba(2, 6, 14, 0.72)'
                : '0 10px 22px rgba(15, 23, 42, 0.18)',
            }}
          >
            {title}
          </div>

          {(difficulty || language) ? (
            <div
              style={{
                marginTop: 12,
                textAlign: 'center',
                fontSize: 23,
                fontWeight: 600,
                color: softText,
                letterSpacing: 0.4,
              }}
            >
              {[difficulty, language].filter(Boolean).join(' • ')}
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 28,
            flex: 1,
            borderRadius: 30,
            padding: '18px 20px',
            background: cardBg,
            border: `1px solid ${isDark ? 'rgba(248,250,252,0.16)' : 'rgba(15,23,42,0.13)'}`,
            boxShadow: isDark
              ? '0 20px 40px rgba(2, 6, 14, 0.45)'
              : '0 16px 34px rgba(30, 41, 59, 0.15)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: words.length >= 7 ? 'space-between' : 'space-evenly',
            }}
          >
            {words.map((item, index) => {
              const rowStart = introFrames + index * rowDurationFrames;
              const wordStart = rowStart;
              const wordEnd = wordStart + wordSpeakFrames;
              const translationStart = wordEnd + betweenFrames;
              const translationEnd = translationStart + translationSpeakFrames;
              const rowEnd = rowStart + rowDurationFrames;

              const rowAppear = spring({
                frame: frame - (rowStart - 12),
                fps,
                config: {
                  damping: 18,
                  stiffness: 170,
                  mass: 0.9,
                },
              });

              const rowActive = frame >= rowStart && frame <= rowEnd;
              const wordActive = frame >= wordStart && frame <= wordEnd;
              const translationActive =
                frame >= translationStart && frame <= translationEnd;

              const wave =
                Math.sin((frame / 12 + index * 0.9) * 0.8) * (rowActive ? 2.8 : 1.1);

              const wordUnderline = wordActive
                ? interpolate(frame, [wordStart, wordEnd], [0.06, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })
                : frame > wordEnd
                  ? 1
                  : 0.06;

              const translationUnderline = translationActive
                ? interpolate(frame, [translationStart, translationEnd], [0.06, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })
                : frame > translationEnd
                  ? 1
                  : 0.06;

              const rowOpacity =
                frame < rowStart - 14
                  ? 0.08
                  : frame < rowStart
                    ? interpolate(frame, [rowStart - 14, rowStart], [0.08, 0.75], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      })
                    : rowActive
                      ? 1
                      : 0.72;

              const activeGlow = rowActive
                ? isDark
                  ? '0 0 0 1px rgba(250, 204, 21, 0.5), 0 0 28px rgba(250, 204, 21, 0.28)'
                  : '0 0 0 1px rgba(124, 58, 237, 0.45), 0 0 24px rgba(124, 58, 237, 0.2)'
                : 'none';

              return (
                <div
                  key={`${item.word}-${item.translation}-${index}`}
                  style={{
                    opacity: rowOpacity,
                    transform: `translateY(${(1 - rowAppear) * 16 + wave}px) scale(${0.97 + rowAppear * 0.03})`,
                    transition: 'opacity 0.2s linear',
                    borderRadius: 20,
                    padding: '12px 12px 10px',
                    boxShadow: activeGlow,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: rowFontSize,
                          lineHeight: 1.05,
                          fontWeight: wordActive ? 800 : 700,
                          letterSpacing: -1,
                          color: wordActive ? activeColor : safeText,
                          textShadow: wordActive
                            ? isDark
                              ? '0 0 18px rgba(250, 204, 21, 0.45)'
                              : '0 0 14px rgba(124, 58, 237, 0.28)'
                            : 'none',
                        }}
                      >
                        {item.word}
                      </div>
                      <div
                        style={{
                          marginTop: 7,
                          height: 4,
                          borderRadius: 99,
                          transform: `scaleX(${wordUnderline})`,
                          transformOrigin: 'left center',
                          background: wordActive
                            ? activeColor
                            : isDark
                              ? 'rgba(248,250,252,0.42)'
                              : 'rgba(19,33,58,0.28)',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: rowFontSize - 14,
                        lineHeight: 1,
                        fontWeight: 800,
                        color: translationActive || wordActive ? activeColor : softText,
                        transform: `translateX(${rowActive ? 4 : 0}px)`,
                        textShadow: rowActive
                          ? isDark
                            ? '0 0 14px rgba(250, 204, 21, 0.4)'
                            : '0 0 12px rgba(124, 58, 237, 0.22)'
                          : 'none',
                      }}
                    >
                      →
                    </div>

                    <div>
                      <div
                        style={{
                          textAlign: 'right',
                          fontSize: rowFontSize,
                          lineHeight: 1.05,
                          fontWeight: translationActive ? 800 : 700,
                          letterSpacing: -1,
                          color: translationActive ? activeColor : safeText,
                          textShadow: translationActive
                            ? isDark
                              ? '0 0 18px rgba(250, 204, 21, 0.45)'
                              : '0 0 14px rgba(124, 58, 237, 0.28)'
                            : 'none',
                        }}
                      >
                        {item.translation}
                      </div>
                      <div
                        style={{
                          marginTop: 7,
                          marginLeft: 'auto',
                          height: 4,
                          borderRadius: 99,
                          transform: `scaleX(${translationUnderline})`,
                          transformOrigin: 'right center',
                          background: translationActive
                            ? activeColor
                            : isDark
                              ? 'rgba(248,250,252,0.42)'
                              : 'rgba(19,33,58,0.28)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      {voiceSegments.map((clip, index) => {
        return (
          <Sequence from={clip.startFrame} key={`${clip.src}-${index}`}>
            <Audio src={resolveAssetPath(clip.src)} volume={clip.volume ?? 0.96} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
