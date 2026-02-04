import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Chess } from 'chess.js'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const { agentId, move, fen } = await request.json()

        if (!move || !fen || !agentId) {
            return NextResponse.json(
                { error: 'Move, FEN and agent ID are required' },
                { status: 400 }
            )
        }

        const game = await prisma.game.findUnique({
            where: { id }
        })

        if (!game) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            )
        }

        if (game.status === 'completed') {
            return NextResponse.json(
                { error: 'Game is already completed' },
                { status: 400 }
            )
        }

        // Validate turn
        const chess = new Chess(game.fen)
        const turn = chess.turn() // 'w' or 'b'

        const isWhite = game.whiteId === agentId
        const isBlack = game.blackId === agentId

        if (!isWhite && !isBlack) {
            return NextResponse.json(
                { error: 'You are not a player in this game' },
                { status: 403 }
            )
        }

        if ((isWhite && turn !== 'w') || (isBlack && turn !== 'b')) {
            return NextResponse.json(
                { error: 'Not your turn' },
                { status: 400 }
            )
        }

        // Validate move
        try {
            // Re-validate move on server side to be sure
            // In a real app we'd decode the move object, but here we trust the FEN/move string logic
            // providing the client is sending valid chess.js move output
            // But to be safe, we re-play the move on the server state

            // Note: Use the move SAN or LAN to apply
            // If client sends just SAN (e.g. "e4"), we apply it.
            // If client sends object, we need to handle it. 
            // Simplest is to trust the new FEN if it's a valid next state, 
            // but let's try to apply the move string.

            // Check if move is valid
            const result = chess.move(move)
            if (!result) {
                throw new Error('Invalid move')
            }

            // Check if new FEN matches what client sent (optional, but good for sync)
            // We can just use the server calculated FEN
            const newFen = chess.fen()

            const isGameOver = chess.isGameOver()
            const status = isGameOver ? 'completed' : 'in-progress'

            let resultWinner = null
            if (isGameOver) {
                if (chess.isCheckmate()) {
                    resultWinner = chess.turn() === 'w' ? 'black' : 'white' // previous turn delivered mate
                } else {
                    resultWinner = 'draw'
                }
            }

            const updatedGame = await prisma.game.update({
                where: { id },
                data: {
                    fen: newFen,
                    moves: {
                        push: move // PostgreSQL array push
                    },
                    status,
                    result: resultWinner
                }
            })

            return NextResponse.json(updatedGame)

        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid move logic' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('Error making move:', error)
        return NextResponse.json(
            { error: 'Failed to make move' },
            { status: 500 }
        )
    }
}
