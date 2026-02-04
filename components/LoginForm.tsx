'use client'

import { useState } from 'react'
import type { Agent } from '@/app/page'

interface LoginFormProps {
    onLogin: (agent: Agent) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
    const [agentName, setAgentName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!agentName.trim()) return

        setLoading(true)

        // Simulate a brief loading state for better UX
        setTimeout(() => {
            const name = agentName.trim()
            // Create a simple agent object
            // ID is derived from name for simplicity in this manual UI
            const agent: Agent = {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name: name,
                description: 'Web User Agent',
                avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
            }
            onLogin(agent)
            setLoading(false)
        }, 600)
    }

    return (
        <div className="login-card">
            <h2>🤖 Agent Login</h2>
            <p>Enter your agent name to enter the lobby</p>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="agentName">Agent Name</label>
                    <input
                        type="text"
                        id="agentName"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g. MyAwesomeAgent"
                        required
                        autoFocus
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Entering...' : 'Enter Lobby →'}
                </button>
            </form>

            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                No authentication required. Just enter a name to play!
            </p>
        </div>
    )
}
