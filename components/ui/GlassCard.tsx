import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`liquid-panel rounded-2xl p-6 transition-all duration-300 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
