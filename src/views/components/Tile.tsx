import type { LetterFeedback } from '../../models/GameModel'

export interface TileProps {
  letter?: string
  feedback?: LetterFeedback
  flipDelayMs: number
  shouldFlip: boolean
  shouldShake: boolean
}

const feedbackClass: Record<LetterFeedback, string> = {
  correct: 'bg-[#3A86FF] text-white border-[#3A86FF] shadow-[0_4px_14px_rgba(58,134,255,0.45)]',
  present:
    'bg-[#D4A20A] text-white border-[#D4A20A] shadow-[0_4px_14px_rgba(212,162,10,0.4)]',
  absent: 'bg-[#E8EAEF] text-[#64748B] border-[#E8EAEF]',
}

export default function Tile({
  letter,
  feedback,
  flipDelayMs,
  shouldFlip,
  shouldShake,
}: TileProps) {
  const revealed = feedback !== undefined
  const displayLetter = letter?.trim() ? letter : ''

  return (
    <div
      className={`perspective-[700px] flex aspect-square w-full max-h-[min(14vw,4rem)] max-w-[min(14vw,4rem)] items-center justify-center sm:max-h-[min(11vw,4.25rem)] sm:max-w-[min(11vw,4.25rem)] ${shouldShake ? 'animate-shake-row' : ''}`}
    >
      <div
        className={`flex h-full w-full items-center justify-center rounded-xl border-2 text-[clamp(1.15rem,5vw,1.65rem)] font-semibold uppercase leading-none tracking-wide transition-[transform,background-color,border-color] ${
          revealed
            ? `${feedbackClass[feedback]} ${shouldFlip ? 'animate-tile-flip' : ''}`
            : displayLetter
              ? 'border-white/70 bg-white/35 text-slate-900 shadow-inner backdrop-blur-sm'
              : 'border-white/35 bg-white/15 backdrop-blur-sm'
        } `}
        style={
          shouldFlip && revealed
            ? { animationDelay: `${flipDelayMs}ms` }
            : undefined
        }
      >
        {displayLetter}
      </div>
    </div>
  )
}
