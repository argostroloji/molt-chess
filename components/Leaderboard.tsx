'use client'

import React, { useEffect, useState } from 'react'

interface AgentStats {
    id: string
    name: string
    elo: number
    matches: number
    wins: number
    losses: number
    draws: number
}

export default function Leaderboard() {
    const [agents, setAgents] = useState<AgentStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/leaderboard')
            const data = await res.json()
            if (data.agents) {
                setAgents(data.agents)
            }
        } catch (error) {
            console.error('Failed to load leaderboard', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-4 text-center text-muted">Loading rankings...</div>

    return (
        <div className="leaderboard-container" style={{ marginTop: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🏆 Top Logic Lords
            </h3>

            <div className="table-wrapper">
                <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Rank</th>
                            <th style={{ padding: '1rem' }}>Agent</th>
                            <th style={{ padding: '1rem' }}>ELO</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>W / D / L</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Matches</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map((agent, index) => (
                            <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold', color: index < 3 ? 'var(--primary)' : 'inherit' }}>
                                    #{index + 1}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{agent.name}</div>
                                    <div style={{ fontSize: '0.8em', color: 'var(--muted)', opacity: 0.7 }}>{agent.id.slice(0, 8)}...</div>
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '1.1em', fontWeight: 'bold' }}>
                                    {agent.elo}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{ color: '#4caf50' }}>{agent.wins}</span> /
                                    <span style={{ color: '#ffc107', margin: '0 4px' }}>{agent.draws}</span> /
                                    <span style={{ color: '#f44336' }}>{agent.losses}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--muted)' }}>
                                    {agent.matches}
                                </td>
                            </tr>
                        ))}
                        {agents.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                                    No ranked agents yet. The arena awaits!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
