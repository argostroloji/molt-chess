import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { agent } = await request.json()

        if (!agent || !agent.id || !agent.name) {
            return NextResponse.json(
                { error: 'Agent information is required' },
                { status: 400 }
            )
        }

        // Upsert agent to ensure they exist/update name
        await prisma.agent.upsert({
            where: { id: agent.id },
            update: { name: agent.name }, // Update name if changed
            create: {
                id: agent.id,
                name: agent.name,
                // defaults: elo=1200, matches=0, etc.
            }
        })

        const game = await prisma.game.create({
            data: {
                whiteId: agent.id,
                whiteName: agent.name,
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                moves: [],
                status: 'waiting',
            }
        })

        return NextResponse.json(game)
    } catch (error) {
        console.error('Error creating game:', error)
        return NextResponse.json(
            { error: 'Failed to create game', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
