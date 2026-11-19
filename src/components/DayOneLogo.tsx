import React from 'react';

interface DayOneLogoProps {
  size?: number;
  variant?: 'mark' | 'full';
  className?: string;
  showSubtitle?: boolean;
}

export const DayOneLogo: React.FC<DayOneLogoProps> = ({
  size = 32,
  variant = 'mark',
  className = '',
  showSubtitle = false,
}) => {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Background container */}
      <rect width="48" height="48" rx="12" fill="#E2765A" />
      
      {/* Protective cradle & 'D' loop */}
      <path
        d="M 16 13 H 24 C 31 13 35.5 17.5 35.5 24 C 35.5 30.5 31 35 24 35 H 16 Z"
        stroke="#FAF8F5"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Vertical spine '1' */}
      <line
        x1="17.5"
        y1="13"
        x2="17.5"
        y2="35"
        stroke="#FAF8F5"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* The Rising Sun / First Dawn */}
      <circle cx="25" cy="24" r="4.5" fill="#FDF6E2" stroke="#FAF8F5" strokeWidth="0.8" />
      
      {/* Horizon calibration cut */}
      <line
        x1="20.5"
        y1="24"
        x2="29.5"
        y2="24"
        stroke="#E2765A"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center ${className}`} suppressHydrationWarning>
        {mark}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} suppressHydrationWarning>
      {mark}
      <div className="flex flex-col" suppressHydrationWarning>
        <div className="flex items-center gap-1.5" suppressHydrationWarning>
          <span className="font-bold tracking-tight text-[#201E1D] dark:text-[#FAF8F5] leading-none text-base">
            Day<span className="text-[#E2765A]">One</span>
          </span>
          <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-full border border-[#FCDCCB] dark:border-[#543830] text-[#8A3510] dark:text-[#F8BCA0] bg-[#FFF0E6] dark:bg-[#2D2422]">
            Baby
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-[#75706B] dark:text-[#A09A92] tracking-tight mt-0.5">
            Gentle Care & Health Log
          </span>
        )}
      </div>
    </div>
  );
};
