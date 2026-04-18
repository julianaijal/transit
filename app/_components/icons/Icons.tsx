import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconRhythm(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 12h3l2-7 4 14 2-7 2 3h5"/>
    </svg>
  );
}

export function IconPulse(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>
    </svg>
  );
}

export function IconJourney(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="6" cy="6" r="2"/>
      <circle cx="18" cy="18" r="2"/>
      <path d="M6 8v4a4 4 0 004 4h4"/>
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="11" cy="11" r="7"/>
      <path d="m20 20-4-4"/>
    </svg>
  );
}

export function IconArrow(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M5 12h14m-5-5 5 5-5 5"/>
    </svg>
  );
}

export function IconBack(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M19 12H5m5 5-5-5 5-5"/>
    </svg>
  );
}

export function IconTrain(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <rect x="5" y="3" width="14" height="14" rx="3"/>
      <path d="M5 10h14M8 20l-2 2M16 20l2 2"/>
      <circle cx="9" cy="14" r=".8" fill="currentColor"/>
      <circle cx="15" cy="14" r=".8" fill="currentColor"/>
    </svg>
  );
}

export function IconTweaks(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10"/>
      <circle cx="16" cy="7" r="2"/>
      <circle cx="8" cy="17" r="2"/>
    </svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="m6 6 12 12M18 6 6 18"/>
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  );
}

export function IconWind(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 8h10a3 3 0 100-6M3 16h14a3 3 0 110 6M3 12h18"/>
    </svg>
  );
}
