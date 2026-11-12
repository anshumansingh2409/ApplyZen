import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/applyzen-logo.png';
import iconImg from '../../assets/applyzen-icon.png';

/**
 * Official ApplyZen Brand Logo Component
 * Matches the user-provided official brand identity (stylized checkmark-A + applyZen wordmark).
 *
 * @param {'full' | 'icon' | 'combined'} variant - 'full' uses the official image, 'combined' uses icon + styled text, 'icon' uses only the checkmark mark
 * @param {'sm' | 'md' | 'lg' | 'xl'} size - Visual sizing
 * @param {string} to - If provided, wraps logo in a react-router Link
 * @param {string} className - Additional CSS classes
 */
export default function BrandLogo({
  variant = 'full',
  size = 'md',
  to = null,
  className = '',
  imgClassName = '',
  showBadge = null
}) {
  // Height presets for the full logo
  const fullSizeClasses = {
    xs: 'h-6',
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14',
  };

  // Size presets for icon-only
  const iconSizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  let content;

  if (variant === 'icon') {
    content = (
      <img
        src={iconImg}
        alt="applyZen"
        className={`${iconSizeClasses[size] || 'w-9 h-9'} object-contain ${imgClassName}`}
      />
    );
  } else if (variant === 'combined') {
    // Shows the icon alongside HTML text "applyZen"
    content = (
      <div className="flex items-center gap-2.5">
        <img
          src={iconImg}
          alt="applyZen"
          className={`${iconSizeClasses[size] || 'w-9 h-9'} object-contain ${imgClassName}`}
        />
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-[#05603a] text-xl font-sans">
            apply<span className="text-[#034a27]">Zen</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-1.5 py-0.5 rounded-full shadow-2xs">
              {showBadge}
            </span>
          )}
        </div>
      </div>
    );
  } else {
    // Default 'full' variant: the exact official high-res transparent logo artwork
    content = (
      <div className="flex items-center gap-2">
        <img
          src={logoImg}
          alt="applyZen"
          className={`${fullSizeClasses[size] || 'h-9'} w-auto object-contain select-none ${imgClassName}`}
        />
        {showBadge && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-1.5 py-0.5 rounded-full shadow-2xs">
            {showBadge}
          </span>
        )}
      </div>
    );
  }

  if (to) {
    return (
      <Link to={to} className={`inline-flex items-center transition-opacity hover:opacity-95 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {content}
    </div>
  );
}

