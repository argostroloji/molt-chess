import fetch from 'node-fetch'

// Replace with your Vercel URL (e.g., https://chessai-xyz.vercel.app)
const BASE_URL = process.argv[2] || 'http://localhost:3000'

const agent1 = {
    id: 'elo-bot-white-' + Date.now(),
    name: 'ELO Bot White',
    description: 'Sacrificial Lamb'
}

const agent2 = {
    id: 'elo-bot-black-' + Date.now(),
    name: 'ELO Bot Black',
    description: 'The Winner'
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function testElo() {
    console.log(`🚀 Testing ELO System at ${BASE_URL}...\n`)

    try {
        // 1. Create Game
        console.log('1️⃣ Creating Game with White...')
        const createRes = await fetch(`${BASE_URL}/api/games/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent: agent1 })
        })
        const game: any = await createRes.json()
        console.log('✅ Game Created:', game.id)

        // 2. Join Game
        console.log('2️⃣ Joining Game with Black...')
        const joinRes = await fetch(`${BASE_URL}/api/games/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: game.id, agent: agent2 })
        })
        await joinRes.json()
        console.log('✅ Joined successfully!\n')

        // 3. Fool's Mate Sequence
        // 3. Fool's Mate Sequence
        // We use SAN strings here as they are often safer with chess.js move()
        const moves = [
            { agent: agent1, move: 'f3', fen: 'rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq - 0 1' },
            { agent: agent2, move: 'e5', fen: 'rnbqkbnr/pppp1ppp/8/4p3/5P2/8/PPPPP1PP/RNBQKBNR w KQkq - 0 2' },
            { agent: agent1, move: 'g4', fen: 'rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq g3 0 2' },
            { agent: agent2, move: 'Qh4#', fen: 'rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3' }
        ]

        console.log('3️⃣ Executing Fool\'s Mate...')
        let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

        for (const m of moves) {
            console.log(`   Move: ${m.move} (${m.agent.name})`)
            const res = await fetch(`${BASE_URL}/api/games/${game.id}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: m.agent.id,
                    move: m.move, // Sending string "f3", "e5", etc.
                    fen: m.fen
                })
            })

            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`Move failed: ${txt}`)
            }
            const data: any = await res.json()
            if (data.status === 'completed') {
                console.log('   🏆 Game Completed! Winner:', data.result)
            }
            await sleep(500)
        }
        console.log('')

        // 4. Check Leaderboard
        console.log('4️⃣ Checking Leaderboard for ELO updates...')
        // Wait a bit for DB update if async (it's awaited in api though)
        await sleep(1000)

        const lbRes = await fetch(`${BASE_URL}/api/leaderboard`)
        const lbData: any = await lbRes.json()

        const whiteEntry = lbData.agents.find((a: any) => a.id === agent1.id)
        const blackEntry = lbData.agents.find((a: any) => a.id === agent2.id)

        console.log('   White Agent Stats:', whiteEntry)
        console.log('   Black Agent Stats:', blackEntry)

        if (whiteEntry && whiteEntry.elo < 1200 && blackEntry && blackEntry.elo > 1200) {
            console.log('\n✅ ELO System Verified! Points were exchanged correctly.')
        } else {
            console.error('\n❌ ELO Verification Failed! Ratings did not update as expected.')
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error)
    }
}

testElo()
