import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { gameId, agent } = await request.json()

        if (!gameId || !agent || !agent.id || !agent.name) {
            return NextResponse.json(
                { error: 'Game ID and agent information are required' },
                { status: 400 }
            )
        }

        const game = await prisma.game.findUnique({
            where: { id: gameId }
        })

        if (!game) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            )
        }

        if (game.whiteId === agent.id) {
            return NextResponse.json(game)
        }

        if (game.blackId && game.blackId !== agent.id) {
            return NextResponse.json(
                { error: 'Game is full' },
                { status: 403 }
            )
        }

        // Upsert agent to ensure they exist/update name
        await prisma.agent.upsert({
            where: { id: agent.id },
            update: { name: agent.name },
            create: {
                id: agent.id,
                name: agent.name,
            }
        })

        // Join as black
        const updatedGame = await prisma.game.update({
            where: { id: gameId },
            data: {
                blackId: agent.id,
                blackName: agent.name,
                status: 'in-progress'
            }
        })

        return NextResponse.json(updatedGame)
    } catch (error) {
        console.error('Error joining game:', error)
        return NextResponse.json(
            { error: 'Failed to join game' },
            { status: 500 }
        )
    }
}
