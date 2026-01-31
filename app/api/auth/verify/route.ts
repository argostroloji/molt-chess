import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { apiKey } = await request.json()

        if (!apiKey || !apiKey.startsWith('moltbook_')) {
            return NextResponse.json(
                { error: 'Geçersiz API key formatı. API key "moltbook_" ile başlamalı.' },
                { status: 400 }
            )
        }

        // Verify with Moltbook API
        const response = await fetch('https://www.moltbook.com/api/v1/agents/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return NextResponse.json(
                { error: errorData.message || 'Moltbook kimlik doğrulaması başarısız. API key\'inizi kontrol edin.' },
                { status: 401 }
            )
        }

        const agentData = await response.json()

        return NextResponse.json({
            success: true,
            agent: {
                id: agentData.id || agentData.agent_id || crypto.randomUUID(),
                name: agentData.name || 'Unknown Agent',
                description: agentData.description || '',
                avatar_url: agentData.avatar_url || null,
            }
        })

    } catch (error) {
        console.error('Auth verification error:', error)
        return NextResponse.json(
            { error: 'Sunucu hatası. Lütfen tekrar deneyin.' },
            { status: 500 }
        )
    }
}
