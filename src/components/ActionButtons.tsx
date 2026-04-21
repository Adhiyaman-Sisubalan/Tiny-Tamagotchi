interface ActionButtonsProps {
  onFeed: () => void
  onPlay: () => void
  onRest: () => void
}

export function ActionButtons({ onFeed, onPlay, onRest }: ActionButtonsProps) {
  return (
    <>
      <button
        data-testid="action-feed"
        onClick={onFeed}
        className="device-btn device-btn-feed"
        aria-label="Feed"
      >
        <span style={{ fontSize: 18 }}>🍖</span>
        <span>Feed</span>
      </button>

      <button
        data-testid="action-play"
        onClick={onPlay}
        className="device-btn device-btn-play"
        aria-label="Play"
      >
        <span style={{ fontSize: 18 }}>🎾</span>
        <span>Play</span>
      </button>

      <button
        data-testid="action-rest"
        onClick={onRest}
        className="device-btn device-btn-rest"
        aria-label="Rest"
      >
        <span style={{ fontSize: 18 }}>💤</span>
        <span>Rest</span>
      </button>
    </>
  )
}
