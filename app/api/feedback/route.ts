import { NextRequest, NextResponse } from 'next/server'

import { DIFY_CONFIG } from '@/lib/dify-config'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messageId, rating, content, user } = body

        if (!messageId || !rating) {
            return NextResponse.json(
                { error: 'Missing messageId or rating' },
                { status: 400 }
            )
        }

        if (!DIFY_CONFIG.API_KEY || !DIFY_CONFIG.API_BASE_URL) {
            return NextResponse.json(
                { error: 'API configuration missing' },
                { status: 500 }
            )
        }

        const response = await fetch(`${DIFY_CONFIG.API_BASE_URL}/messages/${messageId}/feedbacks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_CONFIG.API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rating,
                user: user || DIFY_CONFIG.DEFAULT_USER,
                content,
            }),
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Dify error: ${response.status}` },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Feedback API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
