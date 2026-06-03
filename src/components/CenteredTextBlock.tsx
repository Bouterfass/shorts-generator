import {ReactNode} from 'react';

type CenteredTextBlockProps = {
  children: ReactNode;
  opacity: number;
  scale: number;
  translateY: number;
  maxWidth?: number;
};

export const CenteredTextBlock = ({
  children,
  opacity,
  scale,
  translateY,
  maxWidth = 920,
}: CenteredTextBlockProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          textAlign: 'center',
          transform: `translateY(calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          paddingLeft: 60,
          paddingRight: 60,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
};
