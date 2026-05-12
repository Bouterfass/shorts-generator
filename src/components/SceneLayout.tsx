import {AbsoluteFill} from 'remotion';
import {ReactNode} from 'react';

type SceneLayoutProps = {
  children: ReactNode;
  opacity?: number;
};

export const SceneLayout = ({children, opacity = 1}: SceneLayoutProps) => {
  return (
    <AbsoluteFill
      style={{
        padding: 80,
        boxSizing: 'border-box',
        color: '#f2f5ff',
        fontFamily: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
        background:
          'radial-gradient(circle at 20% 15%, #1b2b50 0%, rgba(16, 22, 36, 1) 45%, #090d16 100%)',
        opacity,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 85% 20%, rgba(110, 231, 255, 0.14), transparent 45%), radial-gradient(circle at 20% 85%, rgba(97, 97, 255, 0.12), transparent 35%)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
