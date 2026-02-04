'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Agent } from '@/app/page'

interface Game {
    id: string
    whiteId: string
    whiteName: string
    blackId: string | null
    blackName: string | null
    status: 'waiting' | 'in-progress' | 'completed'
    createdAt: string
}

interface GameLobbyProps {
    agent: Agent
}

export default function GameLobby({ agent }: GameLobbyProps) {
    const router = useRouter()
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(false)

    // Poll for games list updates
    const loadGames = useCallback(async () => {
        try {
            const res = await fetch('/api/games')
            if (res.ok) {
                const data = await res.json()
                setGames(data.games || [])
            }
        } catch (error) {
            console.error('Failed to load games', error)
        }
    }, [])

    useEffect(() => {
        loadGames()
        const interval = setInterval(loadGames, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [loadGames])

    const createGame = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/games/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent })
            })

            if (res.ok) {
                const game = await res.json()
                router.push(`/game/${game.id}`)
            }
        } catch (error) {
            console.error('Failed to create game', error)
            setLoading(false)
        }
    }

    const joinGame = async (gameId: string) => {
        setLoading(true)
        try {
            const res = await fetch('/api/games/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, agent })
            })

            if (res.ok) {
                router.push(`/game/${gameId}`)
            } else {
                setLoading(false)
            }
        } catch (error) {
            console.error('Failed to join game', error)
            setLoading(false)
        }
    }

    return (
        <div className="lobby">
            <div className="lobby-header">
                <h1>🎮 Game Lobby</h1>
                <button
                    className="btn btn-success"
                    onClick={createGame}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : '+ New Game'}
                </button>
            </div>

            <div className="agent-info">
                <div className="agent-avatar">🤖</div>
                <div className="agent-details">
                    <h3>{agent.name}</h3>
                    <p>{agent.description || 'AI Agent'}</p>
                </div>
            </div>

            {games.length === 0 ? (
                <div className="empty-state">
                    <h3>No games yet</h3>
                    <p>Create the first game and wait for other agents to join!</p>
                </div>
            ) : (
                <div className="games-grid">
                    {games.map((game) => (
                        <div key={game.id} className="game-card">
                            <div className={`game-status ${game.status}`}>
                                {game.status === 'waiting' && '⏳ Waiting for opponent'}
                                {game.status === 'in-progress' && '🎮 In Progress'}
                                {game.status === 'completed' && '✅ Completed'}
                            </div>
                            <h3>Game #{game.id.slice(0, 8)}</h3>
                            <div className="game-players">
                                <span>♔ {game.whiteName}</span>
                                <span>vs</span>
                                <span>♚ {game.blackName || '???'}</span>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                {game.status === 'waiting' && game.whiteId !== agent.id ? (
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={() => joinGame(game.id)}
                                        disabled={loading}
                                    >
                                        Join Game
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                        onClick={() => router.push(`/game/${game.id}`)}
                                        disabled={loading}
                                    >
                                        {game.whiteId === agent.id || game.blackId === agent.id ? 'Continue Game' : 'Spectate'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
