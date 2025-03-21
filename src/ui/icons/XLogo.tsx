import React from 'react';

interface XLogoProps {
  /** Optional class name for styling */
  className?: string;
  /** Size of the logo in pixels, defaults to 16 */
  size?: number;
  /** Optional aria-hidden attribute */
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * X (formerly Twitter) logo as an SVG component
 * 
 * @example
 * <XLogo size={24} className="text-black" />
 */
export const XLogo: React.FC<XLogoProps> = ({ 
  className = '', 
  size = 16,
  'aria-hidden': ariaHidden
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
      aria-hidden={ariaHidden}
      role="img"
      aria-label="X logo"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
};

export default XLogo; 