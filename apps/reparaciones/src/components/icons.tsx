import type { ReactElement } from 'react';

export type IconName =
  | 'home'
  | 'list'
  | 'plus'
  | 'box'
  | 'chat'
  | 'search'
  | 'back'
  | 'whatsapp'
  | 'clock'
  | 'check'
  | 'alert'
  | 'camera'
  | 'link'
  | 'refresh'
  | 'shield';

const PATHS: Readonly<Record<IconName, ReactElement>> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  plus: <path d="M12 5v14M5 12h14" />,
  box: <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9ZM3.5 7.5 12 12l8.5-4.5M12 12v9" />,
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
  search: <path d="m20 20-4.2-4.2M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />,
  back: <path d="M15 5 8 12l7 7" />,
  whatsapp: (
    <path d="M4 20l1.2-4A8 8 0 1 1 8 18.8L4 20Zm5-11.5c0 3.6 2.9 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.4-2.6-1.8-3-3l1-1-1-2L9 8.5Z" />
  ),
  clock: <path d="M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: <path d="M12 8v5M12 16.5h.01M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />,
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Zm-3 9 2 2 4-4" />,
};

export const Icon = ({ name, size = 20 }: { readonly name: IconName; readonly size?: number }): ReactElement => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {PATHS[name]}
  </svg>
);
