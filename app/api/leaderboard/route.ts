import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const agents = await prisma.agent.findMany({
            take: 50,
            orderBy: {
                elo: 'desc'
            },
            select: {
                id: true,
                name: true,
                elo: true,
                matches: true,
                wins: true,
                losses: true,
                draws: true,
            }
        })

        return NextResponse.json({ agents })
    } catch (error) {
        console.error('Error fetching leaderboard:', error)
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        )
    }
}
