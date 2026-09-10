// 功能性界面图标，不代替角色、物品或场景美术。
export type IconName =
  | "home"
  | "yard"
  | "bag"
  | "book"
  | "settings"
  | "close"
  | "back"
  | "letter"
  | "sound"
  | "leaf"
  | "check"
  | "download"
  | "arrow";
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),
    yard: (
      <>
        <path d="M12 21V10M12 15C4 15 3 10 3 6c6 0 9 3 9 9ZM12 11c7 0 9-5 9-9-6 0-9 3-9 9Z" />
      </>
    ),
    bag: (
      <>
        <path d="M8 7V5a4 4 0 0 1 8 0v2M5 7h14l1 14H4L5 7Z" />
        <path d="M5 11c5 4 9 4 14 0M12 12v4" />
      </>
    ),
    book: (
      <>
        <path d="M3 4c4-1 7 0 9 2 2-2 5-3 9-2v16c-4-1-7 0-9 1-2-1-5-2-9-1V4ZM12 6v15" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    back: <path d="m14 5-7 7 7 7M7 12h14" />,
    letter: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    sound: (
      <>
        <path d="M11 4 5 9H2v6h3l6 5V4ZM16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C6 1 2 8 5 15c5 7 16 2 15-12ZM4 21l12-13" />
      </>
    ),
    check: <path d="m5 12 4 4 10-10" />,
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
