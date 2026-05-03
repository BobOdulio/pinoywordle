import type { KeyKnowledge } from '../../models/GameModel'

export interface KeyboardProps {
  keyboard: Record<string, KeyKnowledge>
  onKey: (key: string) => void
  onEnter: () => void
  onBackspace: () => void
  disabled: boolean
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

function keyClasses(knowledge: KeyKnowledge | undefined): string {
  if (!knowledge || knowledge === 'unknown') {
    return 'bg-white/45 text-slate-900 border-white/50 hover:bg-white/65 active:scale-[0.97]'
  }
  if (knowledge === 'correct') {
    return 'bg-[#3A86FF] text-white border-[#3A86FF] shadow-[0_4px_12px_rgba(58,134,255,0.35)]'
  }
  if (knowledge === 'present') {
    return 'bg-[#D4A20A] text-white border-[#D4A20A] shadow-[0_4px_12px_rgba(212,162,10,0.35)]'
  }
  return 'bg-[#E8EAEF] text-[#64748B] border-[#E5E7EB]'
}

export default function Keyboard({
  keyboard,
  onKey,
  onEnter,
  onBackspace,
  disabled,
}: KeyboardProps) {
  return (
    <div
      className="mx-auto flex w-full max-w-[520px] flex-col gap-2 px-1 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
      role="group"
      aria-label="keyboard"
    >
      <div className="flex justify-center gap-1.5">
        {ROWS[0].map((ch) => (
          <button
            key={ch}
            type="button"
            disabled={disabled}
            className={`keyboard-key flex h-12 min-w-[8.5%] flex-1 items-center justify-center rounded-lg border text-sm font-semibold uppercase shadow-sm backdrop-blur-sm transition sm:h-14 sm:text-[0.95rem] ${keyClasses(keyboard[ch])}`}
            onClick={() => onKey(ch)}
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 px-4">
        {ROWS[1].map((ch) => (
          <button
            key={ch}
            type="button"
            disabled={disabled}
            className={`keyboard-key flex h-12 min-w-[8.5%] flex-1 items-center justify-center rounded-lg border text-sm font-semibold uppercase shadow-sm backdrop-blur-sm transition sm:h-14 sm:text-[0.95rem] ${keyClasses(keyboard[ch])}`}
            onClick={() => onKey(ch)}
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          className="keyboard-key flex h-12 min-w-[52px] flex-[1.15] items-center justify-center rounded-lg border border-white/50 bg-white/45 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-900 shadow-sm backdrop-blur-sm hover:bg-white/65 active:scale-[0.97] sm:h-14 sm:min-w-[64px] sm:text-xs"
          onClick={onEnter}
        >
          Enter
        </button>
        {ROWS[2].map((ch) => (
          <button
            key={ch}
            type="button"
            disabled={disabled}
            className={`keyboard-key flex h-12 min-w-[8.5%] flex-1 items-center justify-center rounded-lg border text-sm font-semibold uppercase shadow-sm backdrop-blur-sm transition sm:h-14 sm:text-[0.95rem] ${keyClasses(keyboard[ch])}`}
            onClick={() => onKey(ch)}
          >
            {ch}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          className="keyboard-key flex h-12 min-w-[52px] flex-[1.15] items-center justify-center rounded-lg border border-white/50 bg-white/45 px-2 text-xl font-medium text-slate-900 shadow-sm backdrop-blur-sm hover:bg-white/65 active:scale-[0.97] sm:h-14 sm:min-w-[64px]"
          onClick={onBackspace}
          aria-label="Burahin"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
