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
  // Height presets for the full logo (bolder & larger visual presence)
  const fullSizeClasses = {
    xs: 'h-7',
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-14',
    xl: 'h-18',
  };

  // Size presets for icon-only
  const iconSizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18',
  };

  let content;

  if (variant === 'icon') {
    content = (
      <div className="logo-shimmer-container group cursor-pointer inline-flex items-center">
        <img
          src={iconImg}
          alt="applyZen"
          className={`${iconSizeClasses[size] || 'w-10 h-10'} object-contain filter drop-shadow-[0_1px_2px_rgba(5,96,58,0.35)] contrast-[1.08] transition-transform duration-300 group-hover:scale-105 ${imgClassName}`}
        />
      </div>
    );
  } else if (variant === 'combined') {
    // Shows the icon alongside HTML text "applyZen" with extra bold weight
    content = (
      <div className="logo-shimmer-container group flex items-center gap-2.5 cursor-pointer">
        <img
          src={iconImg}
          alt="applyZen"
          className={`${iconSizeClasses[size] || 'w-10 h-10'} object-contain filter drop-shadow-[0_1px_2px_rgba(5,96,58,0.35)] contrast-[1.08] transition-transform duration-300 group-hover:scale-105 ${imgClassName}`}
        />
        <div className="flex items-center gap-1.5">
          <span className="font-black tracking-tight text-[#044e2f] text-2xl font-sans drop-shadow-[0_1px_1px_rgba(5,96,58,0.2)] transition-colors group-hover:text-[#034026]">
            apply<span className="text-[#02341b]">Zen</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
              {showBadge}
            </span>
          )}
        </div>
      </div>
    );
  } else {
    // Default 'full' variant: official high-res logo with bolder weight & animated light sheen
    content = (
      <div className="logo-shimmer-container group flex items-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.02]">
        <img
          src={logoImg}
          alt="applyZen"
          className={`${fullSizeClasses[size] || 'h-10'} w-auto object-contain select-none filter drop-shadow-[0_1px_1.5px_rgba(5,96,58,0.3)] contrast-[1.06] saturate-[1.05] transition-all duration-300 group-hover:drop-shadow-[0_4px_14px_rgba(5,96,58,0.25)] ${imgClassName}`}
        />
        {showBadge && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
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

