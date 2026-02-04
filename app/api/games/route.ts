import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Fetch waiting games or active games
        const games = await prisma.game.findMany({
            where: {
                status: {
                    in: ['waiting', 'in-progress']
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit to 50 recent games
        })

        return NextResponse.json({ games })
    } catch (error) {
        console.error('Error fetching games:', error)
        return NextResponse.json(
            { error: 'Failed to fetch games', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
