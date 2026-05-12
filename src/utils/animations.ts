import {interpolate, spring} from 'remotion';

export const fadeIn = (
  frame: number,
  startFrame: number,
  durationInFrames: number,
): number => {
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
};

export const fadeOut = (
  frame: number,
  startFrame: number,
  durationInFrames: number,
): number => {
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
};

export const fadeInOut = (
  frame: number,
  fadeInFrames: number,
  fadeOutStartFrame: number,
  fadeOutFrames: number,
): number => {
  const inOpacity = fadeIn(frame, 0, fadeInFrames);
  const outOpacity = fadeOut(frame, fadeOutStartFrame, fadeOutFrames);

  return Math.min(inOpacity, outOpacity);
};

export const popIn = (
  frame: number,
  fps: number,
  delay = 0,
): number => {
  return spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 100,
      mass: 0.8,
      stiffness: 180,
    },
  });
};

export const slideUp = (
  frame: number,
  startFrame: number,
  durationInFrames: number,
  from = 50,
): number => {
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [from, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
};
