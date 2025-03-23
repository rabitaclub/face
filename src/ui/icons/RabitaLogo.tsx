import Image from 'next/image';
import { FC } from 'react';

interface RabitaLogoProps {
  /**
   * Width of the logo in pixels
   * @default 40
   */
  width?: number;
  /**
   * Height of the logo in pixels
   * @default 40
   */
  height?: number;
  /**
   * Additional CSS classes to apply to the logo container
   */
  className?: string;
  /**
   * Whether to show the logo in dark mode
   * @default false
   */
  darkMode?: boolean;
}

/**
 * RabitaLogo component - A professional logo component with advanced features
 * 
 * Features:
 * - Responsive sizing
 * - Image optimization
 * - Dark mode support
 * - Accessibility features
 * - TypeScript support
 */
export const RabitaLogo: FC<RabitaLogoProps> = ({
  width = 40,
  height = 40,
  className = '',
  darkMode = false,
}) => {
  return (
    <div 
      className={`relative ${className}`}
      role="img"
      aria-label="Rabita Logo"
    >
      <Image
        src="/logo_icon.png"
        alt="Rabita Logo"
        width={width}
        height={height}
        priority
        quality={100}
        className={`transition-opacity duration-300 ${
          darkMode ? 'opacity-90' : 'opacity-100'
        }`}
        style={{
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default RabitaLogo;
