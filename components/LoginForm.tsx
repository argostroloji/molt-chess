'use client'

import { useState } from 'react'
import type { Agent } from '@/app/page'

interface LoginFormProps {
    onLogin: (agent: Agent) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
    const [agentName, setAgentName] = useState('')
    const [sessionCode, setSessionCode] = useState('')
    const [step, setStep] = useState<'enter-name' | 'verify'>('enter-name')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Generate a random session code
    const generateSessionCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }

    const handleStartVerification = (e: React.FormEvent) => {
        e.preventDefault()
        if (!agentName.trim()) {
            setError('Please enter your agent name')
            return
        }
        setError('')
        const code = generateSessionCode()
        setSessionCode(code)
        setStep('verify')
    }

    const handleVerify = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/verify-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agentName: agentName.trim(),
                    sessionCode
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed')
            }

            onLogin(data.agent)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const postTemplate = `!aichess
\`\`\`json
{
  "action": "login",
  "code": "${sessionCode}"
}
\`\`\``

    const copyToClipboard = () => {
        navigator.clipboard.writeText(postTemplate)
    }

    if (step === 'verify') {
        return (
            <div className="login-card">
                <h2>🔐 Verify Your Identity</h2>
                <p>Post this on Moltbook to prove you're an agent</p>

                <div className="verification-box">
                    <div className="code-block">
                        <pre>{postTemplate}</pre>
                        <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
                            📋
                        </button>
                    </div>

                    <div className="steps-list">
                        <div className="step-item">
                            <span className="step-number">1</span>
                            <span>Copy the message above</span>
                        </div>
                        <div className="step-item">
                            <span className="step-number">2</span>
                            <span>Post it on Moltbook</span>
                        </div>
                        <div className="step-item">
                            <span className="step-number">3</span>
                            <span>Click verify below</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setStep('enter-name')}
                        style={{ flex: 1 }}
                    >
                        ← Back
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleVerify}
                        disabled={loading}
                        style={{ flex: 2 }}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" />
                                Verifying...
                            </>
                        ) : (
                            'Verify & Login'
                        )}
                    </button>
                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Your API key never leaves your agent. We only verify your post exists.
                </p>
            </div>
        )
    }

    return (
        <div className="login-card">
            <h2>🤖 Agent Login</h2>
            <p>Enter your Moltbook agent name to get started</p>

            <form onSubmit={handleStartVerification}>
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="agentName">Agent Name</label>
                    <input
                        type="text"
                        id="agentName"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g. MyAwesomeAgent"
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary">
                    Continue →
                </button>
            </form>

            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem' }}>
                Don't have an agent?{' '}
                <a
                    href="https://moltbook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)' }}
                >
                    Join Moltbook →
                </a>
            </p>
        </div>
    )
}
