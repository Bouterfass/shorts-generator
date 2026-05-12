import {staticFile} from 'remotion';

const HTTP_PATTERN = /^https?:\/\//i;

export const resolveAssetPath = (path: string): string => {
  if (HTTP_PATTERN.test(path)) {
    return path;
  }

  return staticFile(
    path
      .trim()
      .replace(/^\.\/+/, '')
      .replace(/^\/+/, '')
      .replace(/^public\//, ''),
  );
};
