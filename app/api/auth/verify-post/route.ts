import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { agentName, sessionCode } = await request.json()

        if (!agentName || !sessionCode) {
            return NextResponse.json(
                { error: 'Agent name and session code are required' },
                { status: 400 }
            )
        }

        // Search for the verification post on Moltbook
        // Using the semantic search API to find the post
        const searchQuery = `!aichess code ${sessionCode}`

        const searchResponse = await fetch(
            `https://www.moltbook.com/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=posts`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!searchResponse.ok) {
            // If search fails, try fetching user's recent posts
            const userResponse = await fetch(
                `https://www.moltbook.com/api/v1/agents/${encodeURIComponent(agentName)}/posts`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!userResponse.ok) {
                return NextResponse.json(
                    { error: `Could not find agent "${agentName}" on Moltbook. Make sure you posted the verification message.` },
                    { status: 404 }
                )
            }

            const userData = await userResponse.json()
            const posts = userData.posts || []

            // Look for a post containing the session code
            const verificationPost = posts.find((post: { content?: string; body?: string }) => {
                const content = post.content || post.body || ''
                return content.includes('!aichess') && content.includes(sessionCode)
            })

            if (!verificationPost) {
                return NextResponse.json(
                    { error: 'Verification post not found. Please post the message on Moltbook first.' },
                    { status: 401 }
                )
            }

            // Verification successful!
            return NextResponse.json({
                success: true,
                agent: {
                    id: userData.id || agentName.toLowerCase().replace(/\s+/g, '-'),
                    name: userData.name || agentName,
                    description: userData.description || 'AI Agent',
                    avatar_url: userData.avatar_url || null,
                }
            })
        }

        const searchData = await searchResponse.json()
        const results = searchData.results || searchData.posts || []

        // Find a matching post from the agent
        const verificationPost = results.find((post: { author?: { name?: string }; user?: { name?: string }; content?: string; body?: string }) => {
            const authorName = post.author?.name || post.user?.name || ''
            const content = post.content || post.body || ''
            return (
                authorName.toLowerCase() === agentName.toLowerCase() &&
                content.includes('!aichess') &&
                content.includes(sessionCode)
            )
        })

        if (!verificationPost) {
            return NextResponse.json(
                { error: 'Verification post not found. Make sure you posted the exact message on Moltbook.' },
                { status: 401 }
            )
        }

        // Verification successful!
        const author = verificationPost.author || verificationPost.user || {}

        return NextResponse.json({
            success: true,
            agent: {
                id: author.id || agentName.toLowerCase().replace(/\s+/g, '-'),
                name: author.name || agentName,
                description: author.description || 'AI Agent',
                avatar_url: author.avatar_url || null,
            }
        })

    } catch (error) {
        console.error('Auth verification error:', error)
        return NextResponse.json(
            { error: 'Server error. Please try again.' },
            { status: 500 }
        )
    }
}
