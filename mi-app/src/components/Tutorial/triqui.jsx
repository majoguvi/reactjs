import { useState } from 'react';
import './triqui.css';

const CONFETTI_COLORS = ['#aa3bff', '#22d3ee', '#facc15', '#fb7185', '#4ade80'];
const CONFETTI_PIECES = 48;

function createEmptyBoard() {
  return Array(9).fill(null);
}

function Square({ value, index, nextSymbol, isWinning, disabled, onSquareClick }) {
  const classes = ['square'];
  if (value) classes.push(`square--${value.toLowerCase()}`);
  if (isWinning) classes.push('square--winning');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onSquareClick}
      disabled={disabled}
      data-next={nextSymbol}
      aria-label={`Casilla ${index + 1}${value ? ', ' + value : ', vacía'}`}
    >
      {value && <span className="square-mark">{value}</span>}
    </button>
  );
}

function Board({ xIsNext, squares, winningLine, gameOver, onPlay }) {
  const nextSymbol = xIsNext ? 'X' : 'O';

  function handleClick(i) {
    if (gameOver || squares[i]) {
      return;
    }
    const nextSquares = squares.slice();
    nextSquares[i] = nextSymbol;
    onPlay(nextSquares);
  }

  return (
    <div
      className={`board${winningLine ? ' board--won' : ''}`}
      role="group"
      aria-label="Tablero de triqui"
    >
      {squares.map((value, i) => (
        <Square
          key={i}
          index={i}
          value={value}
          nextSymbol={nextSymbol}
          isWinning={Boolean(winningLine?.includes(i))}
          disabled={gameOver || Boolean(value)}
          onSquareClick={() => handleClick(i)}
        />
      ))}
    </div>
  );
}

function ScoreCard({ label, value, tone, active }) {
  return (
    <div className={`score-card score-card--${tone}${active ? ' score-card--active' : ''}`}>
      <span className="score-card__label">{label}</span>
      <span key={value} className="score-card__value">{value}</span>
    </div>
  );
}

// Confeti 100% CSS. Los valores salen de una fórmula por índice (no de Math.random)
// para que el render sea puro y siempre se vea igual.
function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: CONFETTI_PIECES }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            '--left': `${(i * 37) % 100}%`,
            '--delay': `${((i * 17) % 20) / 10}s`,
            '--duration': `${2.4 + (i % 5) * 0.4}s`,
            '--drift': `${((i * 29) % 120) - 60}px`,
            '--spin': `${360 + (i % 4) * 180}deg`,
            '--color': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}

export default function Game() {
  const [history, setHistory] = useState([createEmptyBoard()]);
  const [currentMove, setCurrentMove] = useState(0);
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  // Resultado de esta ronda que ya se sumó al marcador (null = ninguno todavía)
  const [countedOutcome, setCountedOutcome] = useState(null);

  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  // Todo esto se DERIVA del tablero actual, no se guarda en estado:
  // así, al viajar en el historial, el ganador y el confeti se actualizan solos.
  const winnerInfo = calculateWinner(currentSquares);
  const isDraw = !winnerInfo && currentSquares.every(Boolean);
  const gameOver = Boolean(winnerInfo) || isDraw;

  function updateScore(nextOutcome) {
    if (nextOutcome === countedOutcome) {
      return;
    }
    setScore((prev) => {
      const next = { ...prev };
      if (countedOutcome) next[countedOutcome] -= 1;
      if (nextOutcome) next[nextOutcome] += 1;
      return next;
    });
    setCountedOutcome(nextOutcome);
  }

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    updateScore(getOutcome(nextSquares));
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  function handleNewGame() {
    setHistory([createEmptyBoard()]);
    setCurrentMove(0);
    setCountedOutcome(null);
  }

  function handleResetAll() {
    handleNewGame();
    setScore({ X: 0, O: 0, draw: 0 });
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Ir al movimiento #' + move;
    } else {
      description = 'Ir al inicio del juego';
    }
    return (
      <li key={move}>
        <button
          type="button"
          className={`history-btn${move === currentMove ? ' history-btn--current' : ''}`}
          aria-current={move === currentMove ? 'step' : undefined}
          onClick={() => jumpTo(move)}
        >
          {description}
        </button>
      </li>
    );
  });

  let statusKey = 'playing';
  let statusClass = 'status';
  let status;
  if (winnerInfo) {
    const w = winnerInfo.winner.toLowerCase();
    statusKey = w;
    statusClass += ` status--over status--${w}`;
    status = (
      <>
        <span aria-hidden="true">🏆</span>
        <span>
          ¡Ganó <strong className={`mark mark--${w}`}>{winnerInfo.winner}</strong>!
        </span>
      </>
    );
  } else if (isDraw) {
    statusKey = 'draw';
    statusClass += ' status--over status--draw';
    status = (
      <>
        <span aria-hidden="true">🤝</span>
        <span>¡Empate!</span>
      </>
    );
  } else {
    status = (
      <span>
        Siguiente jugador:{' '}
        <strong className={`mark mark--${xIsNext ? 'x' : 'o'}`}>{xIsNext ? 'X' : 'O'}</strong>
      </span>
    );
  }

  return (
    <div className="game">
      {winnerInfo && <Confetti />}

      <header className="game-header">
        <h2 className="game-title">Triqui</h2>
        <p className="game-subtitle">Tres en línea y la victoria es tuya</p>
      </header>

      <div className="scoreboard">
        <ScoreCard label="Jugador X" value={score.X} tone="x" active={!gameOver && xIsNext} />
        <ScoreCard label="Empates" value={score.draw} tone="draw" active={false} />
        <ScoreCard label="Jugador O" value={score.O} tone="o" active={!gameOver && !xIsNext} />
      </div>

      <div key={statusKey} className={statusClass} role="status" aria-live="polite">
        {status}
      </div>

      <div className="game-main">
        <div className="game-board">
          <Board
            xIsNext={xIsNext}
            squares={currentSquares}
            winningLine={winnerInfo?.line}
            gameOver={gameOver}
            onPlay={handlePlay}
          />
          <div className="game-actions">
            <button
              type="button"
              className={`btn btn--primary${gameOver ? ' btn--attention' : ''}`}
              onClick={handleNewGame}
            >
              Nueva partida
            </button>
            <button type="button" className="btn" onClick={handleResetAll}>
              Reiniciar marcador
            </button>
          </div>
        </div>

        <div className="game-info">
          <h3 className="game-info__title">Historial</h3>
          <ol>{moves}</ol>
        </div>
      </div>
    </div>
  );
}

// Devuelve { winner, line } si hay ganador, o null si no.
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  return null;
}

// 'X' | 'O' | 'draw' | null
function getOutcome(squares) {
  const info = calculateWinner(squares);
  if (info) return info.winner;
  return squares.every(Boolean) ? 'draw' : null;
}