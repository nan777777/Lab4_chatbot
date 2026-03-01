export interface ThinkingStep {
    position: number
    thought: string
    tool: string
    toolInput: string
    observation: string
}

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    thinkingSteps?: ThinkingStep[]
    messageId?: string // Dify message ID for feedback
    feedback?: 'like' | 'dislike' // Feedback state
    files?: { name: string; type: string; size: number }[] // Uploaded files metadata
}
