// Small line icons (24×24, drawn with the current text color).
const base = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false,
}

export function HomeIcon() {
  return (
    <svg {...base}>
      <path d="M4 10.4 12 4l8 6.4V19a1.6 1.6 0 0 1-1.6 1.6H15v-5.6H9v5.6H5.6A1.6 1.6 0 0 1 4 19z" />
    </svg>
  )
}

export function WalkIcon() {
  return (
    <svg {...base}>
      <circle cx="13.6" cy="4.3" r="1.7" />
      <path d="M12.6 7.6 11 13.6M11 13.6l-2.1 3.8L7.2 21M11 13.6l2.6 3v4.4M12.4 8.4 9.6 10.4l-1 2.8M12.4 8.4l2.2 2.8 2.6 1" />
    </svg>
  )
}

export function LogIcon() {
  return (
    <svg {...base}>
      <rect x="5" y="3" width="14" height="18" rx="2.6" />
      <path d="M9 8.2h6M9 12h6M9 15.8h3.6" />
    </svg>
  )
}

export function JournalIcon() {
  return (
    <svg {...base}>
      <rect x="5" y="3" width="14" height="18" rx="2.2" />
      <path d="M8.6 3v18M11.6 8.2h4.4M11.6 12h4.4" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg {...base} strokeWidth={2.4}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function ChevronDown() {
  return (
    <svg {...base} width={16} height={16} strokeWidth={2.2}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// A small flame for the Streak chip (an icon, not a celebration). Takes the text colour
// (set to sea glass by the chip), so it follows the theme.
export function FlameIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2.5c.6 3-1.6 4.6-3.2 6.6C7.4 10.9 6.5 12.6 6.5 14.7A5.5 5.5 0 0 0 12 20.5a5.5 5.5 0 0 0 5.5-5.8c0-2.4-1.2-4.1-2.3-5.4-.2 1.4-.8 2.4-1.7 2.9.3-3.5-.4-7.2-1.5-9.7z"
      />
    </svg>
  )
}
