import React from 'react';
import logoDark from '@/assets/vooxline-logo-transparent.png';
import logoLight from '@/assets/vooxline-logo-light-transparent.png';

interface VooxlineLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  showSubtitle?: boolean;
  className?: string;
}

export const VooxlineLogo: React.FC<VooxlineLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  };

  const imageSrc = variant === 'dark' ? logoDark : logoLight;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
        {/* Subtle emerald neon ambient glow behind interlocking rings */}
        <div className="absolute top-1/2 left-[38%] -translate-x-1/2 -translate-y-1/2 w-16 h-8 bg-primary-container/20 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <img
          src={imageSrc}
          alt="Vooxline"
          className={`w-auto object-contain relative z-10 transition-all drop-shadow-[0_0_12px_rgba(0,230,118,0.25)] group-hover:drop-shadow-[0_0_20px_rgba(0,230,118,0.5)] ${sizeClasses[size]}`}
          loading="eager"
        />
      </div>

      {showSubtitle && (
        <span className="text-[10px] text-on-surface-variant font-label-code uppercase tracking-widest mt-1 opacity-80">
          Enterprise Contact Center
        </span>
      )}
    </div>
  );
};

export default VooxlineLogo;
