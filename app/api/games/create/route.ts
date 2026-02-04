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
            { error: 'Failed to create game' },
            { status: 500 }
        )
    }
}
