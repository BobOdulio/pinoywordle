import { useMemo } from 'react'
import { MAX_ATTEMPTS, WORD_LENGTH } from '../models/WordModel'
import { useGameController } from '../controllers/GameController'
import Header from './components/Header'
import Keyboard from './components/Keyboard'
import Tile from './components/Tile'

function formatDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fil-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function GameView() {
  const game = useGameController()

  const formattedDate = useMemo(
    () => formatDayLabel(game.dayKey),
    [game.dayKey],
  )

  return (
    <div className="relative flex min-h-dvh flex-col px-3 py-6 sm:px-6">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#FF9F5A] via-[#FF8C42] to-[#FF6B35]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.28),_transparent_55%)]" />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <Header formattedDate={formattedDate} />

        <section
          className="mx-auto mb-6 w-full max-w-[420px] rounded-3xl border border-white/45 bg-white/25 p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:p-6"
          aria-label="grid ng salita"
        >
          <div className="flex flex-col gap-2 sm:gap-2.5">
            {game.rows.slice(0, MAX_ATTEMPTS).map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-5 gap-2 sm:gap-2.5"
              >
                {Array.from({ length: WORD_LENGTH }).map((_, col) => {
                  const letter = row.letters[col]
                  const fb = row.feedback?.[col]
                  const shouldFlip =
                    row.feedback !== null &&
                    game.animatingRowIndex === rowIndex
                  const shouldShake = game.shakeRowIndex === rowIndex
                  return (
                    <Tile
                      key={`${rowIndex}-${col}`}
                      letter={letter}
                      feedback={fb}
                      flipDelayMs={col * 95}
                      shouldFlip={shouldFlip}
                      shouldShake={shouldShake}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {game.outcome === 'lost' && (
            <p
              className="mt-5 text-center text-base font-semibold text-slate-900 drop-shadow-sm"
              role="status"
            >
              Ang tamang salita ay{' '}
              <span className="rounded-lg bg-white/50 px-2 py-0.5 font-['Poppins'] tracking-widest">
                {game.secretWord}
              </span>
            </p>
          )}

          {game.isDayComplete && (
            <p className="mt-4 text-center text-sm font-medium leading-relaxed text-slate-800/95">
              {game.outcome === 'won'
                ? 'Magaling! Bumalik ka bukas para sa bagong salita.'
                : 'Walang matira pang subok. Bumalik ka bukas.'}
            </p>
          )}
        </section>

        <div className="mt-auto flex flex-1 flex-col justify-end pb-4">
          <Keyboard
            keyboard={game.keyboard}
            onKey={game.pushLetter}
            onEnter={game.submitGuess}
            onBackspace={game.deleteLetter}
            disabled={game.isDayComplete}
          />
        </div>
      </div>

      {game.toast && (
        <div
          className="animate-toast fixed bottom-6 left-1/2 z-50 max-w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-white/50 bg-slate-900/88 px-5 py-3 text-center text-sm font-medium text-white shadow-lg backdrop-blur-md"
          role="status"
        >
          {game.toast}
        </div>
      )}
    </div>
  )
}
