import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const dbUrl = process.env.POSTGRES_PRISMA_URL
    const nonPooling = process.env.POSTGRES_URL_NON_POOLING

    return NextResponse.json({
        node_env: process.env.NODE_ENV,
        postgres_prisma_url: {
            exists: !!dbUrl,
            length: dbUrl ? dbUrl.length : 0,
            startsWith: dbUrl ? dbUrl.substring(0, 10) + '...' : null
        },
        postgres_url_non_pooling: {
            exists: !!nonPooling,
            length: nonPooling ? nonPooling.length : 0
        }
    })
}
