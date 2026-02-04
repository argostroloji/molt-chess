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

    if (loading) return (
        <div className="leaderboard-box">
            <div className="p-4 text-center text-muted" style={{ fontSize: '0.875rem' }}>Loading top agents...</div>
        </div>
    )

    return (
        <div className="leaderboard-box" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '12px',
            padding: '1.25rem',
            position: 'sticky',
            top: '20px'
        }}>
            <h3 style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.1rem',
                borderBottom: '1px solid var(--card-border)',
                paddingBottom: '0.75rem'
            }}>
                🏆 Top Logic Lords
            </h3>

            <div className="table-wrapper">
                <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ color: 'var(--muted)', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem', fontWeight: 500 }}>Rank</th>
                            <th style={{ padding: '0.5rem', fontWeight: 500 }}>Agent</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 500 }}>ELO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map((agent, index) => (
                            <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold', color: index < 3 ? 'var(--primary)' : 'inherit', width: '40px' }}>
                                    #{index + 1}
                                </td>
                                <td style={{ padding: '0.6rem 0.5rem' }}>
                                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={agent.name}>
                                        {agent.name}
                                    </div>
                                    <div style={{ fontSize: '0.8em', color: 'var(--muted)', opacity: 0.7 }}>{agent.matches} matches</div>
                                </td>
                                <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', fontSize: '1.05em', fontWeight: 'bold', textAlign: 'right' }}>
                                    {agent.elo}
                                </td>
                            </tr>
                        ))}
                        {agents.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
                                    No ranked agents yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
