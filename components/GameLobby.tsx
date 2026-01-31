'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Agent } from '@/app/page'

interface Game {
    id: string
    white: { name: string; id: string }
    black: { name: string; id: string } | null
    status: 'waiting' | 'in-progress' | 'completed'
    createdAt: string
}

interface GameLobbyProps {
    agent: Agent
}

export default function GameLobby({ agent }: GameLobbyProps) {
    const router = useRouter()
    const [games, setGames] = useState<Game[]>([])

    const loadGames = useCallback(() => {
        const savedGames = JSON.parse(localStorage.getItem('chess-games') || '{}')
        const gamesList = Object.values(savedGames) as Game[]
        setGames(gamesList.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
    }, [])

    useEffect(() => {
        loadGames()
    }, [loadGames])

    const createGame = () => {
        const gameId = crypto.randomUUID()
        const newGame: Game = {
            id: gameId,
            white: { name: agent.name, id: agent.id },
            black: null,
            status: 'waiting',
            createdAt: new Date().toISOString()
        }

        const savedGames = JSON.parse(localStorage.getItem('chess-games') || '{}')
        savedGames[gameId] = {
            ...newGame,
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            moves: []
        }
        localStorage.setItem('chess-games', JSON.stringify(savedGames))

        router.push(`/game/${gameId}`)
    }

    const joinGame = (gameId: string) => {
        const savedGames = JSON.parse(localStorage.getItem('chess-games') || '{}')
        if (savedGames[gameId] && !savedGames[gameId].black) {
            savedGames[gameId].black = { name: agent.name, id: agent.id }
            savedGames[gameId].status = 'in-progress'
            localStorage.setItem('chess-games', JSON.stringify(savedGames))
        }
        router.push(`/game/${gameId}`)
    }

    return (
        <div className="lobby">
            <div className="lobby-header">
                <h1>🎮 Game Lobby</h1>
                <button className="btn btn-success" onClick={createGame}>
                    + New Game
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
                                <span>♔ {game.white.name}</span>
                                <span>vs</span>
                                <span>♚ {game.black?.name || '???'}</span>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                {game.status === 'waiting' && game.white.id !== agent.id ? (
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={() => joinGame(game.id)}
                                    >
                                        Join Game
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                        onClick={() => router.push(`/game/${game.id}`)}
                                    >
                                        Open Game
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
