import fetch from 'node-fetch'

// Replace with your Vercel URL (e.g., https://chessai-xyz.vercel.app)
const BASE_URL = process.argv[2] || 'http://localhost:3000'

const agent1 = {
    id: 'test-agent-1-' + Date.now(),
    name: 'Test Agent 1',
    description: 'API Tester'
}

const agent2 = {
    id: 'test-agent-2-' + Date.now(),
    name: 'Test Agent 2',
    description: 'API Tester'
}

async function testApi() {
    console.log(`🚀 Testing API at ${BASE_URL}...\n`)

    try {
        // 0. Probe API Existence
        console.log('0️⃣ Probing API existence (GET /api/games)...')
        const probeRes = await fetch(`${BASE_URL}/api/games`)
        console.log(`   Status: ${probeRes.status} ${probeRes.statusText}`)

        if (!probeRes.ok) {
            const text = await probeRes.text()
            console.log('   Probe Response:', text)
        }

        if (probeRes.status === 404) {
            throw new Error('API not found! The server is likely running an old version. Please check Vercel deployment status.')
        }

        // 1. Create Game
        console.log('1️⃣ Creating Game with Agent 1...')
        const createRes = await fetch(`${BASE_URL}/api/games/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent: agent1 })
        })

        if (!createRes.ok) {
            const errBody = await createRes.text()
            console.error('❌ Server Error Body:', errBody)
            throw new Error(`Create failed: ${createRes.statusText}`)
        }
        const game: any = await createRes.json()
        console.log('✅ Game Created:', game.id)
        console.log(`   White: ${game.whiteName} (${game.whiteId})\n`)

        // 2. List Games
        console.log('2️⃣ Fetching Game List...')
        const listRes = await fetch(`${BASE_URL}/api/games`)
        const listData: any = await listRes.json()
        const found = listData.games.find((g: any) => g.id === game.id)
        if (found) console.log('✅ Game found in list!')
        else console.warn('⚠️ Game NOT found in public list (might be delayed)')
        console.log('')

        // 3. Join Game
        console.log('3️⃣ Joining Game with Agent 2...')
        const joinRes = await fetch(`${BASE_URL}/api/games/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: game.id, agent: agent2 })
        })

        if (!joinRes.ok) throw new Error(`Join failed: ${joinRes.statusText}`)
        const updatedGame: any = await joinRes.json()
        console.log('✅ Joined successfully!', updatedGame.blackName ? 'as Black' : 'Failed to assign black')
        console.log(`   Black: ${updatedGame.blackName} (${updatedGame.blackId})\n`)

        // 4. Test Move (Optional)
        console.log('4️⃣ Testing Move (White: e2 -> e4)...')
        const moveRes = await fetch(`${BASE_URL}/api/games/${game.id}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId: agent1.id,
                move: { from: 'e2', to: 'e4', promotion: 'q' },
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
            })
        })

        if (moveRes.ok) {
            const moveData: any = await moveRes.json()
            console.log('✅ Move accepted!')
            console.log('   New FEN:', moveData.fen)
        } else {
            console.log('❌ Move rejected (Expected if turn logic is strict or game finished)')
        }

        console.log('\n🎉 API Test Completed Successfully!')

    } catch (error) {
        console.error('\n❌ Test Failed:', error)
    }
}

testApi()
