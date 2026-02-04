'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Chess, Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { Agent } from '@/app/page'

interface GameData {
    id: string
    whiteId: string
    whiteName: string
    blackId: string | null
    blackName: string | null
    fen: string
    moves: string[]
    status: 'waiting' | 'in-progress' | 'completed'
    result?: string
}

export default function GamePage() {
    const params = useParams()
    const router = useRouter()
    const gameId = params?.id as string

    // We need the logged in agent. Ideally this should be in a context, 
    // but for now we'll try to get it from the parent or check if persisted.
    // Since this is a page, we don't get props from the parent layout directly easily 
    // without a state manager.
    // However, the user flow is Home -> Login -> Set State -> GameLobby -> GamePage.
    // If we refresh GamePage, we lose state.
    // We should probably save the agent in localStorage or session for persistence.
    // For this refactor, I will assume the user has to login. If not, redirect to home.
    // But since I can't easily change the root layout to provide context right now,
    // I will read passing agent state from window/storage if I add it to LoginForm.
    // BUT checking the original code: Home holds the state. GameLobby receives it. 
    // GamePage is a separate route. 
    // Wait, the original code had clean URL routing `/game/[id]`. 
    // If I navigate there, Home component unmounts? 
    // Standard Next.js app directory: Yes.
    // The original `Home` component rendered `GameLobby` conditionally!
    // Ah! `app/page.tsx` renders `GameLobby`.
    // But `GameLobby` used `router.push('/game/${gameId}')`.
    // So `app/game/[id]/page.tsx` is a SEPARATE page.
    // The agent state in `Home` (app/page.tsx) is LOST when navigating to `/game/...`.
    // Unless `Home` wraps everything or we use a Context.
    // The original code `app/page.tsx` lines 56: `<GameLobby agent={agent} />`.
    // `GameLobby` lines 53: `router.push(/game/${gameId})`.
    // This navigation performs a full page transition to a new route.
    // So `GamePage` (at `app/game/[id]/page.tsx`) would NOT have the `agent` info!
    // How did it work before?
    // It didn't "work" with authentication persistence before either, BUT
    // the previous code used `localStorage` for GAMES. It didn't need the agent for *viewing* necessarily,
    // or maybe it was broken for that part?
    // Let's check `GamePage` (step 37).
    // It used `localStorage.getItem('chess-games')`. It determined "Turn" based on game state.
    // It didn't disable moves based on who you are! It just allowed moving if it was valid chess.
    // SECURITY FLAW!
    // Now I am adding security. I NEED to know who the user is.
    // I must save the agent to localStorage on login.

    const [agent, setAgent] = useState<Agent | null>(null)
    const [game, setGame] = useState<Chess>(new Chess())
    const [gameData, setGameData] = useState<GameData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [isSubmittingMove, setIsSubmittingMove] = useState(false)

    // Poll ref to avoid closures
    const gameDataRef = useRef<GameData | null>(null)

    useEffect(() => {
        // Try to recover agent from localStorage
        const storedAgent = localStorage.getItem('molt-agent')
        if (storedAgent) {
            setAgent(JSON.parse(storedAgent))
        }
        // If not found, we just stay as null (spectator)
    }, [])

    const fetchGame = useCallback(async () => {
        try {
            const res = await fetch(`/api/games/${gameId}`)
            if (res.ok) {
                const data = await res.json()

                // Only update if changed
                if (JSON.stringify(data) !== JSON.stringify(gameDataRef.current)) {
                    setGameData(data)
                    gameDataRef.current = data
                    setGame(new Chess(data.fen))

                    if (data.status === 'completed') {
                        setShowModal(true)
                    }
                }
            } else {
                if (res.status === 404) setError('Game not found')
                else setError('Failed to load game')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [gameId])

    useEffect(() => {
        if (!agent) return

        fetchGame()
        const interval = setInterval(fetchGame, 2000) // Poll every 2s for moves
        return () => clearInterval(interval)
    }, [fetchGame, agent])

    async function onDrop(sourceSquare: Square, targetSquare: Square) {
        if (!agent || !gameData || isSubmittingMove) return false
        if (gameData.status === 'completed') return false

        // Optimistic check
        const tempGame = new Chess(game.fen())
        try {
            const move = tempGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            })
            if (!move) return false // Invalid move locally
        } catch {
            return false
        }

        // Prevent moving if not your turn
        const isWhite = gameData.whiteId === agent.id
        const isBlack = gameData.blackId === agent.id

        if (!isWhite && !isBlack) return false
        if (isWhite && game.turn() !== 'w') return false
        if (isBlack && game.turn() !== 'b') return false

        setIsSubmittingMove(true)

        // Optimistic update
        setGame(tempGame)

        try {
            const res = await fetch(`/api/games/${gameId}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: agent.id,
                    move: { from: sourceSquare, to: targetSquare, promotion: 'q' }, // Send object or string
                    // sending SAN is risky if ambiguity, sending from/to is better.
                    // My API endpoint tried `chess.move(move)`. 
                    // chess.js `move()` accepts object or string. Object is safer.
                    fen: gameData.fen // Send current known FEN to verify
                })
            })

            if (res.ok) {
                const updatedGame = await res.json()
                setGameData(updatedGame)
                gameDataRef.current = updatedGame
                setGame(new Chess(updatedGame.fen))
            } else {
                // Revert on failure
                const errorData = await res.json()
                console.error('Move failed', errorData)
                setGame(new Chess(gameData.fen)) // Revert
                alert(errorData.error || 'Move failed')
            }
        } catch (err) {
            console.error(err)
            setGame(new Chess(gameData.fen)) // Revert
        } finally {
            setIsSubmittingMove(false)
        }

        return true
    }

    function formatMoves() {
        if (!gameData) return []
        const formatted = []
        for (let i = 0; i < gameData.moves.length; i += 2) {
            formatted.push({
                number: Math.floor(i / 2) + 1,
                white: gameData.moves[i] || '',
                black: gameData.moves[i + 1] || ''
            })
        }
        return formatted
    }

    if (loading) return <div className="loading">Loading game...</div>
    if (error) return <div className="error-container"><h2>Error</h2><p>{error}</p><button className="btn btn-primary" onClick={() => router.push('/')}>Back to Home</button></div>

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
                                onPieceDrop: ({ sourceSquare, targetSquare }) => {
                                    if (!sourceSquare || !targetSquare) return false

                                    // Optimistic check for UI
                                    const temp = new Chess(game.fen())
                                    try {
                                        const move = temp.move({
                                            from: sourceSquare as Square,
                                            to: targetSquare as Square,
                                            promotion: 'q',
                                        })
                                        if (!move) return false
                                    } catch {
                                        return false
                                    }
                                    // Trigger async server action
                                    onDrop(sourceSquare as Square, targetSquare as Square)
                                    return true
                                },
                                boardOrientation: (agent && gameData && agent.id === gameData.blackId) ? 'black' : 'white',
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

                        <div className="players-info" style={{ marginBottom: '1rem' }}>
                            <div className={gameData?.whiteId === agent?.id ? 'active-player' : ''}>
                                ♔ {gameData?.whiteName} {gameData?.whiteId === agent?.id && '(You)'}
                            </div>
                            <div className={gameData?.blackId === agent?.id ? 'active-player' : ''}>
                                ♚ {gameData?.blackName || 'Waiting...'} {gameData?.blackId === agent?.id && '(You)'}
                            </div>
                        </div>

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
                            {gameData?.moves.length === 0 && (
                                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                                    No moves yet
                                </p>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            {gameData?.status === 'waiting' && (
                                <div className="waiting-message">
                                    ⏳ Waiting for opponent to join...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{gameData?.result || 'Game Over'}</h2>
                        <div className="modal-buttons">
                            <button className="btn btn-secondary" onClick={() => router.push('/')}>
                                Back to Lobby
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
