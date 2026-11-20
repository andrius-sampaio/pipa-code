import type { JSX } from 'preact'

// Ícones SVG inline (estilo Lucide, traço currentColor). Sem dependências e
// consistentes entre plataformas (ao contrário de emojis). Todos decorativos
// (aria-hidden), com texto/tooltip ao lado quando necessário.

interface IconProps {
  size?: number
  class?: string
  title?: string
}

function Svg({ size = 18, children, ...rest }: IconProps & { children: JSX.Element | JSX.Element[] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconMonitor = (p: IconProps) => (
  <Svg {...p}><rect x="2" y="4" width="20" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Svg>
)

export const IconSmartphone = (p: IconProps) => (
  <Svg {...p}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></Svg>
)

export const IconX = (p: IconProps) => (
  <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>
)

export const IconFolder = (p: IconProps) => (
  <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>
)

export const IconFolderOpen = (p: IconProps) => (
  <Svg {...p}><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" /></Svg>
)

export const IconFile = (p: IconProps) => (
  <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></Svg>
)

export const IconPlay = (p: IconProps) => (
  <Svg {...p}><path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" /></Svg>
)

export const IconStop = (p: IconProps) => (
  <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none" /></Svg>
)

export const IconPanel = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15h18" /></Svg>
)

export const IconCode = (p: IconProps) => (
  <Svg {...p}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></Svg>
)

export const IconBook = (p: IconProps) => (
  <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z" /></Svg>
)

export const IconUpload = (p: IconProps) => (
  <Svg {...p}><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 21h14" /></Svg>
)

export const IconDownload = (p: IconProps) => (
  <Svg {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></Svg>
)

export const IconBox = (p: IconProps) => (
  <Svg {...p}><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></Svg>
)

export const IconBulb = (p: IconProps) => (
  <Svg {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" /></Svg>
)
