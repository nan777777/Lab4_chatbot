import { NextRequest } from 'next/server'

import { DIFY_CONFIG } from '@/lib/dify-config'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { query, conversation_id, user, files } = body

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        if (!DIFY_CONFIG.API_KEY || !DIFY_CONFIG.API_BASE_URL) {
            return new Response(JSON.stringify({ error: 'API configuration missing' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const difyPayload: Record<string, unknown> = {
            inputs: {},
            query,
            response_mode: 'streaming',
            user: user || DIFY_CONFIG.DEFAULT_USER,
        }

        if (files && Array.isArray(files) && files.length > 0) {
            difyPayload.files = files
        }

        if (conversation_id) {
            difyPayload.conversation_id = conversation_id
        }

        const difyResponse = await fetch(`${DIFY_CONFIG.API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_CONFIG.API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(difyPayload),
        })

        if (!difyResponse.ok) {
            return new Response(JSON.stringify({ error: `Dify error: ${difyResponse.status}` }), {
                status: difyResponse.status,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const encoder = new TextEncoder()
        const difyBody = difyResponse.body
        if (!difyBody) {
            return new Response(JSON.stringify({ error: 'No response body' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const reader = difyBody.getReader()
        const decoder = new TextDecoder()

        // State for parsing
        let nodeCounter = 0
        const nodeMap = new Map<string, number>()
        let isThinking = false
        let thinkingPos = 0

        const stream = new ReadableStream({
            async start(controller) {
                let buffer = ''

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split('\n')
                        buffer = lines.pop() || ''

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const jsonStr = line.slice(6)
                                    // Skip empty
                                    if (!jsonStr.trim()) continue

                                    const event = JSON.parse(jsonStr)

                                    // 1. Node Started
                                    if (event.event === 'node_started') {
                                        nodeCounter++
                                        const nodeId = event.data?.node_id || `node-${Date.now()}`
                                        const title = event.data?.title || event.data?.node_type || 'Processing'
                                        nodeMap.set(nodeId, nodeCounter)

                                        // Init thought step (empty thought content for now)
                                        controller.enqueue(encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: 'thought',
                                                position: nodeCounter,
                                                tool: title,
                                                thought: '',
                                                conversation_id: event.conversation_id,
                                                message_id: event.message_id,
                                            })}\n\n`
                                        ))
                                    }

                                    // 2. Node Finished
                                    else if (event.event === 'node_finished') {
                                        const nodeId = event.data?.node_id
                                        const pos = nodeMap.get(nodeId) || nodeCounter
                                        const outputs = event.data?.outputs
                                        const error = event.data?.error

                                        let observation = ''
                                        if (error) {
                                            observation = `Error: ${error}`
                                        } else if (outputs && Object.keys(outputs).length > 0) {
                                            // Pretty print short outputs
                                            try {
                                                observation = JSON.stringify(outputs, null, 2).slice(0, 500)
                                            } catch { }
                                        }

                                        if (observation) {
                                            controller.enqueue(encoder.encode(
                                                `data: ${JSON.stringify({
                                                    type: 'thought',
                                                    position: pos,
                                                    observation: observation,
                                                    thought: '', // append empty thought
                                                    conversation_id: event.conversation_id,
                                                    message_id: event.message_id,
                                                })}\n\n`
                                            ))
                                        }
                                    }

                                    // 3. Message (Token streaming)
                                    else if (event.event === 'message' || event.event === 'agent_message') {
                                        let content = event.answer || ''

                                        // Simple parsing for <think> tags
                                        // Case 1: Start thinking
                                        if (!isThinking && content.includes('<think>')) {
                                            const parts = content.split('<think>')
                                            if (parts[0]) {
                                                // Send pre-think content as message
                                                controller.enqueue(encoder.encode(
                                                    `data: ${JSON.stringify({
                                                        type: 'message',
                                                        answer: parts[0],
                                                        conversation_id: event.conversation_id,
                                                        message_id: event.message_id,
                                                    })}\n\n`
                                                ))
                                            }

                                            isThinking = true
                                            nodeCounter++
                                            thinkingPos = nodeCounter // Assign a new "thought step" for this reasoning block

                                            // Initialize the thinking step
                                            controller.enqueue(encoder.encode(
                                                `data: ${JSON.stringify({
                                                    type: 'thought',
                                                    position: thinkingPos,
                                                    tool: 'Reasoning Process',
                                                    thought: '',
                                                    conversation_id: event.conversation_id,
                                                    message_id: event.message_id,
                                                })}\n\n`
                                            ))

                                            if (parts[1]) {
                                                // Send post-think content as thought
                                                // Check if it immediately closes (unlikely but possible)
                                                if (parts[1].includes('</think>')) {
                                                    const subParts = parts[1].split('</think>')
                                                    controller.enqueue(encoder.encode(
                                                        `data: ${JSON.stringify({
                                                            type: 'thought',
                                                            position: thinkingPos,
                                                            thought: subParts[0],
                                                            conversation_id: event.conversation_id,
                                                            message_id: event.message_id,
                                                        })}\n\n`
                                                    ))
                                                    isThinking = false
                                                    if (subParts[1]) {
                                                        controller.enqueue(encoder.encode(
                                                            `data: ${JSON.stringify({
                                                                type: 'message',
                                                                answer: subParts[1],
                                                                conversation_id: event.conversation_id,
                                                                message_id: event.message_id,
                                                            })}\n\n`
                                                        ))
                                                    }
                                                } else {
                                                    // Just thought content
                                                    controller.enqueue(encoder.encode(
                                                        `data: ${JSON.stringify({
                                                            type: 'thought',
                                                            position: thinkingPos,
                                                            thought: parts[1],
                                                            conversation_id: event.conversation_id,
                                                            message_id: event.message_id,
                                                        })}\n\n`
                                                    ))
                                                }
                                            }
                                        }
                                        // Case 2: End thinking
                                        else if (isThinking && content.includes('</think>')) {
                                            const parts = content.split('</think>')
                                            if (parts[0]) {
                                                // Send remaining thought content
                                                controller.enqueue(encoder.encode(
                                                    `data: ${JSON.stringify({
                                                        type: 'thought',
                                                        position: thinkingPos,
                                                        thought: parts[0],
                                                        conversation_id: event.conversation_id,
                                                        message_id: event.message_id,
                                                    })}\n\n`
                                                ))
                                            }

                                            isThinking = false

                                            if (parts[1]) {
                                                // Send post-think content as message
                                                controller.enqueue(encoder.encode(
                                                    `data: ${JSON.stringify({
                                                        type: 'message',
                                                        answer: parts[1],
                                                        conversation_id: event.conversation_id,
                                                        message_id: event.message_id,
                                                    })}\n\n`
                                                ))
                                            }
                                        }
                                        // Case 3: Just content
                                        else {
                                            if (isThinking) {
                                                // Stream as thought
                                                controller.enqueue(encoder.encode(
                                                    `data: ${JSON.stringify({
                                                        type: 'thought',
                                                        position: thinkingPos,
                                                        thought: content,
                                                        conversation_id: event.conversation_id,
                                                        message_id: event.message_id,
                                                    })}\n\n`
                                                ))
                                            } else {
                                                // Stream as message
                                                controller.enqueue(encoder.encode(
                                                    `data: ${JSON.stringify({
                                                        type: 'message',
                                                        answer: content,
                                                        conversation_id: event.conversation_id,
                                                        message_id: event.message_id,
                                                    })}\n\n`
                                                ))
                                            }
                                        }
                                    }

                                    // 4. Message End
                                    else if (event.event === 'message_end') {
                                        controller.enqueue(encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: 'done',
                                                conversation_id: event.conversation_id,
                                                message_id: event.message_id,
                                            })}\n\n`
                                        ))
                                    }

                                    // 5. Error
                                    else if (event.event === 'error') {
                                        controller.enqueue(encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: 'error',
                                                message: event.message || 'Unknown error',
                                            })}\n\n`
                                        ))
                                    }

                                } catch {
                                    // skip non-JSON lines
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('Stream error:', err)
                    controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`
                    ))
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Chat API error:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
