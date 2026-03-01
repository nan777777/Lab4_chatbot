import { NextRequest, NextResponse } from 'next/server'

import { DIFY_CONFIG } from '@/lib/dify-config'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const user = formData.get('user') as string || DIFY_CONFIG.DEFAULT_USER

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        if (!DIFY_CONFIG.API_KEY || !DIFY_CONFIG.API_BASE_URL) {
            return NextResponse.json(
                { error: 'API configuration missing' },
                { status: 500 }
            )
        }

        // Create a new FormData for the Dify request
        const difyFormData = new FormData()
        difyFormData.append('file', file)
        difyFormData.append('user', user)

        const response = await fetch(`${DIFY_CONFIG.API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_CONFIG.API_KEY}`,
            },
            body: difyFormData,
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
        console.error('Upload API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
