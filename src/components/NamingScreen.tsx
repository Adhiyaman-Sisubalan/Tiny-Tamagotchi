import { useState } from 'react'
import type { CSSProperties } from 'react'
import { usePetStore } from '../store/usePetStore'

export function NamingScreen() {
  const setName = usePetStore((s) => s.setName)
  const [input, setInput]   = useState('')
  const [error, setError]   = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length < 2) {
      setError('Min 2 chars!')
      return
    }
    if (trimmed.length > 20) {
      setError('Max 20 chars!')
      return
    }
    setName(trimmed)
  }

  const lcdFont: CSSProperties = { fontFamily: "'VT323', monospace" }
  const pixelFont: CSSProperties = { fontFamily: "'Press Start 2P', monospace" }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Egg icon (CSS circle) */}
      <div
        aria-hidden="true"
        style={{
          width: 52,
          height: 62,
          background: 'linear-gradient(160deg, #FFF9C4 0%, #F9A825 100%)',
          borderRadius: '50% 50% 45% 45% / 58% 58% 40% 40%',
          boxShadow: '0 4px 14px rgba(249, 168, 37, 0.4)',
          animation: 'petFloat 3s ease-in-out infinite',
        }}
      />

      <p style={{ ...pixelFont, fontSize: 8, color: '#3a5a20', textAlign: 'center', lineHeight: 1.8 }}>
        A new pet<br />is hatching!
      </p>

      <p style={{ ...lcdFont, fontSize: 16, color: '#4a7c59' }}>
        Give it a name:
      </p>

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-2">
        <input
          data-testid="name-input"
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError('') }}
          placeholder="Name…"
          maxLength={25}
          autoFocus
          style={{
            ...lcdFont,
            fontSize: 22,
            width: '100%',
            background: 'rgba(200, 230, 150, 0.5)',
            border: '2px solid #7d8c4f',
            borderRadius: 5,
            padding: '4px 10px',
            color: '#2d4a10',
            textAlign: 'center',
            outline: 'none',
          }}
        />

        {error && (
          <p
            role="alert"
            style={{ ...lcdFont, fontSize: 16, color: '#d32f2f', textAlign: 'center' }}
          >
            {error}
          </p>
        )}

        <button
          data-testid="name-submit"
          type="submit"
          style={{
            ...pixelFont,
            fontSize: 8,
            background: 'linear-gradient(160deg, #A5D6A7 0%, #2E7D32 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '8px 0',
            width: '100%',
            cursor: 'pointer',
            boxShadow: '0 4px 0 #1b5e20, 0 5px 6px rgba(0,0,0,0.2)',
            transition: 'transform 0.08s, box-shadow 0.08s',
          }}
          onMouseDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(4px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 #1b5e20'
          }}
          onMouseUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 #1b5e20, 0 5px 6px rgba(0,0,0,0.2)'
          }}
        >
          HATCH!
        </button>
      </form>
    </div>
  )
}
