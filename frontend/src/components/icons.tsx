import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 18,
  height: 18,
};

export type IconName =
  | 'overview'
  | 'fleet'
  | 'map'
  | 'demand'
  | 'revenue'
  | 'vegetation'
  | 'quality'
  | 'recommend';

const paths: Record<IconName, JSX.Element> = {
  overview: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  fleet: (
    <>
      <rect x="2.5" y="8" width="12" height="7" rx="1.2" />
      <path d="M14.5 11h4l3 3v1h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  map: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 1 1 18.5 10c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  demand: (
    <>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M2.5 20h19" />
    </>
  ),
  revenue: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.3 15.2c.3.9 1.3 1.5 2.7 1.5 1.7 0 2.8-.8 2.8-2 0-1.3-1.2-1.7-2.8-2.1-1.6-.4-2.7-.9-2.7-2.1 0-1.1 1-1.9 2.6-1.9 1.3 0 2.3.5 2.6 1.4" />
    </>
  ),
  vegetation: (
    <>
      <path d="M12 21c0-6.5 3.5-10 8.5-11.5C19.5 15 16 19 12 21Z" />
      <path d="M12 21c0-6-3-9.5-8-11 .5 6 3 10 8 11Z" />
    </>
  ),
  quality: (
    <>
      <path d="M12 3l7 3v5.2c0 4.6-3 8.3-7 9.8-4-1.5-7-5.2-7-9.8V6l7-3Z" />
      <path d="M9 12l2 2 4-4.2" />
    </>
  ),
  recommend: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    </>
  ),
};

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...rest}>
      {paths[name]}
    </svg>
  );
}
