'use client'

import { useState } from 'react'

interface ContractAddressProps {
    address: string
}

export default function ContractAddress({ address }: ContractAddressProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="ca-container" onClick={handleCopy}>
            <div className="ca-label">CA</div>
            <div className="ca-address">{address}</div>
            <div className="ca-icon">
                {copied ? (
                    <span className="ca-success">✓ Copied</span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                )}
            </div>
        </div>
    )
}
