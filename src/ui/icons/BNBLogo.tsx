import React from 'react';

interface BNBLogoProps {
  /** Optional class name for styling */
  className?: string;
  /** Size of the logo in pixels, defaults to 16 */
  size?: number;
  /** Optional aria-hidden attribute */
  'aria-hidden'?: boolean | 'true' | 'false';
  /** Color override, defaults to Binance gold */
  color?: string;
}

/**
 * Binance Smart Chain (BNB) logo as an SVG component
 * 
 * @example
 * <BNBLogo size={24} />
 */
export const BNBLogo: React.FC<BNBLogoProps> = ({ 
  className = '', 
  size = 16,
  color = '#F3BA2F',
  'aria-hidden': ariaHidden
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 126.61 126.61" 
      className={className}
      aria-hidden={ariaHidden}
      role="img"
      aria-label="BNB logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill={color}>
        <path d="M38.73 53.2L63.3 28.62l24.59 24.59 14.3-14.3L63.3 0 24.43 38.9l14.3 14.3z" />
        <path d="M38.73 73.41l24.57 24.58 24.59-24.58 14.31 14.29-.02.02L63.3 126.61 24.43 87.72l.02-.02 14.28-14.29z" />
        <path d="M48.14 63.3l15.16-15.16 15.18 15.16-15.18 15.17-15.16-15.17z" />
        <path d="M0 63.3l15.16-15.16 15.17 15.16-15.17 15.17L0 63.3zM96.27 63.3l15.17-15.16 15.17 15.16-15.17 15.17-15.17-15.17z" />
      </g>
    </svg>
  );
};

export default BNBLogo;
