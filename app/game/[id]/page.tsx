'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Chess, Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'

interface GameData {
    id: string
    white: { name: string; id: string }
    black: { name: string; id: string } | null
    fen: string
    moves: string[]
    status: 'waiting' | 'in-progress' | 'completed'
    winner?: 'white' | 'black' | 'draw'
}

export default function GamePage() {
    const params = useParams()
    const router = useRouter()
    const gameId = params?.id as string

    const [game, setGame] = useState<Chess>(new Chess())
    const [gameData, setGameData] = useState<GameData | null>(null)
    const [moves, setMoves] = useState<string[]>([])
    const [showModal, setShowModal] = useState(false)
    const [gameResult, setGameResult] = useState<string>('')

    useEffect(() => {
        const games = JSON.parse(localStorage.getItem('chess-games') || '{}')
        const savedGame = games[gameId]

        if (savedGame) {
            setGameData(savedGame)
            const chess = new Chess()
            savedGame.moves.forEach((move: string) => {
                chess.move(move)
            })
            setGame(chess)
            setMoves(savedGame.moves)
        }
    }, [gameId])

    function onDrop(sourceSquare: Square, targetSquare: Square) {
        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            })

            if (move === null) return false

            const newMoves = [...moves, move.san]
            setMoves(newMoves)
            setGame(new Chess(game.fen()))

            if (gameData) {
                const games = JSON.parse(localStorage.getItem('chess-games') || '{}')
                games[gameId] = {
                    ...gameData,
                    fen: game.fen(),
                    moves: newMoves,
                    status: game.isGameOver() ? 'completed' : 'in-progress'
                }
                localStorage.setItem('chess-games', JSON.stringify(games))
            }

            if (game.isGameOver()) {
                let result = ''
                if (game.isCheckmate()) {
                    result = game.turn() === 'w' ? 'Black Wins! ♚' : 'White Wins! ♔'
                } else if (game.isDraw()) {
                    result = 'Draw! 🤝'
                } else if (game.isStalemate()) {
                    result = 'Stalemate! 🤝'
                }
                setGameResult(result)
                setShowModal(true)
            }

            return true
        } catch {
            return false
        }
    }

    function formatMoves() {
        const formatted = []
        for (let i = 0; i < moves.length; i += 2) {
            formatted.push({
                number: Math.floor(i / 2) + 1,
                white: moves[i] || '',
                black: moves[i + 1] || ''
            })
        }
        return formatted
    }

    return (
        <>
            <header className="header">
                <div className="logo">
                    <img src="/logo.png" alt="Molt Chess" className="logo-icon" style={{ width: 32, height: 32 }} />
                    <span>Molt Chess</span>
                </div>
                <button className="btn btn-secondary" onClick={() => router.push('/')}>
                    ← Back to Lobby
                </button>
            </header>

            <div className="container">
                <div className="game-container">
                    <div className="board-wrapper">
                        <Chessboard
                            options={{
                                position: game.fen(),
                                onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare as Square, targetSquare as Square),
                                boardStyle: {
                                    borderRadius: '8px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                },
                                darkSquareStyle: { backgroundColor: '#b58863' },
                                lightSquareStyle: { backgroundColor: '#f0d9b5' },
                            }}
                        />
                    </div>

                    <div className="game-sidebar">
                        <h2>Game #{gameId?.slice(0, 8)}</h2>

                        <div className="turn-indicator">
                            <div className={`turn-color ${game.turn() === 'w' ? 'white' : 'black'}`} />
                            <span>{game.turn() === 'w' ? 'White\'s Turn' : 'Black\'s Turn'}</span>
                        </div>

                        {game.isCheck() && (
                            <div className="error-message">
                                ⚠️ Check!
                            </div>
                        )}

                        <h3 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                            Moves
                        </h3>
                        <div className="moves-list">
                            {formatMoves().map((row) => (
                                <div key={row.number} className="move-row">
                                    <span className="move-number">{row.number}.</span>
                                    <span>{row.white}</span>
                                    <span>{row.black}</span>
                                </div>
                            ))}
                            {moves.length === 0 && (
                                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                                    No moves yet
                                </p>
                            )}
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setGame(new Chess())
                                    setMoves([])
                                }}
                            >
                                New Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{gameResult}</h2>
                        <p>Game ended in {moves.length} moves.</p>
                        <div className="modal-buttons">
                            <button className="btn btn-secondary" onClick={() => router.push('/')}>
                                Back to Lobby
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setGame(new Chess())
                                    setMoves([])
                                    setShowModal(false)
                                }}
                            >
                                Play Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
