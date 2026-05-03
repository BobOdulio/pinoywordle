export interface HeaderProps {
  /** Local calendar label e.g. "May 3, 2026" */
  formattedDate: string
}

export default function Header({ formattedDate }: HeaderProps) {
  return (
    <header className="mb-6 text-center">
      <p className="font-['Poppins'] text-[11px] font-semibold uppercase tracking-[0.35em] text-white/90 drop-shadow-sm">
        Isang salita bawat araw
      </p>
      <h1 className="mt-2 font-['Poppins'] text-[clamp(1.75rem,6vw,2.35rem)] font-bold tracking-tight text-white drop-shadow-md">
        Araw-Salita
      </h1>
      <p className="mt-1 text-sm font-medium text-white/85">{formattedDate}</p>
    </header>
  )
}
