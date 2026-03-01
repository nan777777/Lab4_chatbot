'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, RotateCcw, User, Copy, ThumbsUp, ThumbsDown, Check, Paperclip, X, FileText, Image as ImageIcon, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import ReactMarkdown from 'react-markdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FeedbackModal } from '@/components/feedback-modal'
import { ThinkingSteps } from '@/components/thinking-steps'
import { SuggestionCards } from '@/components/suggestion-cards'
import { Message, ThinkingStep } from '@/types/chat'

/* ─── Constants ─── */
const DEMO_USER_ID = 'demo-user'

/* ─── Main Page ─── */
export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [messageCount, setMessageCount] = useState(0)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingThoughts, setStreamingThoughts] = useState<ThinkingStep[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [currentFeedbackMessageId, setCurrentFeedbackMessageId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasMessages = messages.length > 0

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent])

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRate = async (messageId: string, rating: 'like' | 'dislike') => {
    // Check if already rated or invalid
    if (!messageId) return

    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) =>
        msg.messageId === messageId ? { ...msg, feedback: rating } : msg
      )
    )

    if (rating === 'like') {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, rating: 'like', user: DEMO_USER_ID }),
        })
      } catch (error) {
        console.error('Failed to submit like feedback:', error)
      }
    } else {
      // Open modal for dislike
      setCurrentFeedbackMessageId(messageId)
      setFeedbackModalOpen(true)
    }
  }

  const handleFeedbackSubmit = async (content: string) => {
    if (!currentFeedbackMessageId) return

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: currentFeedbackMessageId,
          rating: 'dislike',
          content,
          user: DEMO_USER_ID,
        }),
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setFeedbackModalOpen(false)
      setCurrentFeedbackMessageId(null)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size too large (max 10MB)')
        return
      }
      setSelectedFile(file)
      setIsUploading(true)

      // Upload immediately
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user', DEMO_USER_ID)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.id) {
          setUploadedFileId(data.id)
        } else {
          console.error('Upload failed:', data)
          alert('Upload failed')
          setSelectedFile(null)
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Upload error')
        setSelectedFile(null)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadedFileId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (queryOverride?: string) => {
    const query = queryOverride || inputValue.trim()
    if (!query || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      files: selectedFile ? [{ name: selectedFile.name, type: selectedFile.type, size: selectedFile.size }] : undefined
    }
    setMessages((prev) => [...prev, userMessage])
    setMessageCount((c) => c + 1)
    setInputValue('')

    // Capture state locally before clearing
    const currentUploadedFileId = uploadedFileId
    const currentSelectedFile = selectedFile

    // Clear file state immediately so input bar is reset
    setSelectedFile(null)
    setUploadedFileId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent('')
    setStreamingThoughts([])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          conversation_id: conversationId,
          user: DEMO_USER_ID,
          files: currentUploadedFileId ? [{
            type: currentSelectedFile?.type.startsWith('image/') ? 'image' : 'document', // Dify typically expects 'image' or 'document'
            transfer_method: 'local_file',
            upload_file_id: currentUploadedFileId
          }] : []
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullAnswer = ''
      const thoughtMap = new Map<number, ThinkingStep>()
      let convId = conversationId
      let difyMessageId = '' // Capture Dify ID

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              if (event.message_id) {
                difyMessageId = event.message_id
              }

              if (event.type === 'thought') {
                const pos = event.position || 0
                const existing = thoughtMap.get(pos) || {
                  position: pos,
                  thought: '',
                  tool: '',
                  toolInput: '',
                  observation: '',
                }
                if (event.thought) existing.thought += event.thought
                if (event.tool) existing.tool = event.tool
                if (event.tool_input) existing.toolInput = event.tool_input
                if (event.observation) existing.observation += event.observation
                thoughtMap.set(pos, existing)

                const sortedThoughts = Array.from(thoughtMap.values()).sort(
                  (a, b) => a.position - b.position,
                )
                setStreamingThoughts(sortedThoughts)
              } else if (event.type === 'message') {
                fullAnswer += event.answer || ''
                setStreamingContent(fullAnswer)
              } else if (event.type === 'done') {
                if (event.conversation_id) convId = event.conversation_id
                if (event.message_id) difyMessageId = event.message_id
              }
            } catch {
              // skip
            }
          }
        }
      }

      setConversationId(convId)

      const allThoughts = Array.from(thoughtMap.values()).sort(
        (a, b) => a.position - b.position,
      )

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullAnswer || 'Sorry, I could not generate a response.',
        thinkingSteps: allThoughts,
        messageId: difyMessageId, // Store captured Dify ID
      }
      setMessages((prev) => [...prev, assistantMessage])
      setMessageCount((c) => c + 1)
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingThoughts([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setConversationId('')
    setMessageCount(0)
    setInputValue('')
    setStreamingContent('')
    setStreamingThoughts([])
    // Clear file state
    setSelectedFile(null)
    setUploadedFileId(null)
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-base transition-colors">
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 rounded-xl">
            <AvatarImage src="/images/cgu_icon.png" alt="CGU Bot" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-sm font-bold text-foreground">Claremont Graduate University</h1>
            <p className="text-xs font-medium text-muted-foreground">
              {hasMessages ? `${messageCount} messages` : 'AI Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center size-9 rounded-full border border-input bg-background text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          )}

          {hasMessages && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-1.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
            >
              <RotateCcw className="size-3.5" />
              New chat
            </button>
          )}
        </div>
      </header>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* ─── Welcome Screen ─── */
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center mb-10">
              {/* Large Logo */}
              <div className="relative mb-6">
                <Avatar className="size-28 rounded-3xl shadow-xl ring-4 ring-background dark:ring-white/10 dark:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]">
                  <AvatarImage src="/images/cgu-chatbot.png" alt="CGU Copilot" />
                  <AvatarFallback className="text-4xl bg-muted text-muted-foreground">CGU</AvatarFallback>
                </Avatar>
                {/* Online dot */}
                <div
                  className="absolute -bottom-1 -right-1 size-6 rounded-full border-[4px] border-background shadow-sm bg-green-500"
                />
              </div>
              <h2 className="text-3xl font-bold mt-2 text-foreground tracking-tight">CGU Copilot</h2>
              <p className="text-lg text-muted-foreground mt-2 font-medium">
                Start by asking a question about Campus Life and Events or selecting a topic below
              </p>
            </div>

            {/* Suggestion Cards */}
            <SuggestionCards onSelect={handleSendMessage} />
          </div>
        ) : (
          /* ─── Chat Messages ─── */
          <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
            {messages.map((msg) => (
              <div key={msg.id} className="group">
                {msg.role === 'user' ? (
                  /* User Message */
                  <div className="flex items-start gap-4 flex-row-reverse">
                    <Avatar className="size-10 shrink-0 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-indigo-500 text-white">
                        <User className="size-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-end gap-2 max-w-[80%]">
                      {/* Render File Attachment if present */}
                      {msg.files && msg.files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-2xl bg-muted p-3 shadow-sm border border-border mb-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="size-5 text-blue-500" />
                            ) : (
                              <FileText className="size-5 text-blue-500" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{file.name}</p>
                            <p className="text-xs text-muted-foreground uppercase">{file.type.split('/')[1] || 'FILE'}</p>
                          </div>
                        </div>
                      ))}

                      <div
                        className="rounded-2xl rounded-tr-md px-5 py-3.5 text-base text-white whitespace-pre-wrap shadow-sm bg-primary"
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Assistant Message */
                  <div className="flex items-start gap-4">
                    <Avatar className="size-10 shrink-0 rounded-xl border border-border shadow-sm">
                      <AvatarImage src="/images/cgu-chatbot.png" alt="CGU Bot" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[90%] space-y-2">
                      {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                        <ThinkingSteps steps={msg.thinkingSteps} />
                      )}
                      <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-7 rounded-2xl bg-card px-1 py-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* Actions Bar */}
                      <div className={`flex items-center gap-2 mt-2 transition-opacity ${msg.feedback ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="size-4 text-green-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>

                        <div className="h-4 w-px bg-border mx-1" />

                        {/* Like Button */}
                        {(!msg.feedback || msg.feedback === 'like') && (
                          <button
                            onClick={() => msg.messageId && !msg.feedback && handleRate(msg.messageId, 'like')}
                            disabled={!msg.messageId || !!msg.feedback}
                            className={`p-1.5 rounded-full transition-colors ${msg.feedback === 'like'
                              ? 'text-green-600 bg-green-50 dark:bg-green-950 cursor-default'
                              : 'hover:bg-muted text-muted-foreground'
                              }`}
                            title="Good response"
                          >
                            <ThumbsUp className={`size-4 ${msg.feedback === 'like' ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        {/* Dislike Button */}
                        {(!msg.feedback || msg.feedback === 'dislike') && (
                          <button
                            onClick={() => msg.messageId && !msg.feedback && handleRate(msg.messageId, 'dislike')}
                            disabled={!msg.messageId || !!msg.feedback}
                            className={`p-1.5 rounded-full transition-colors ${msg.feedback === 'dislike'
                              ? 'text-red-600 bg-red-50 dark:bg-red-950 cursor-default'
                              : 'hover:bg-muted text-muted-foreground'
                              }`}
                            title="Bad response"
                          >
                            <ThumbsDown className={`size-4 ${msg.feedback === 'dislike' ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming: thinking + live content */}
            {isStreaming && (
              <div className="flex items-start gap-4">
                <Avatar className="size-10 shrink-0 rounded-xl border border-border shadow-sm animate-pulse">
                  <AvatarImage src="/images/cgu-chatbot.png" alt="CGU Bot" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="max-w-[90%] space-y-2">
                  {streamingThoughts.length > 0 && (
                    <ThinkingSteps steps={streamingThoughts} />
                  )}

                  {streamingContent ? (
                    <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-7">
                      <ReactMarkdown>{streamingContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1 py-2">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span className="font-medium">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* ─── Input Area ─── */}
      <div className="sticky bottom-0 border-t border-border bg-background/90 px-4 py-6 backdrop-blur-lg">
        <div className="mx-auto max-w-3xl">
          {selectedFile && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                {isUploading ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="size-5 text-primary" />
                ) : (
                  <FileText className="size-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="rounded-full p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground transition-colors"
                disabled={isUploading}
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="relative flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 hover:border-input">
            {/* File Upload Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/png,image/jpeg,image/gif,image/webp,.pdf,.txt,.md,.xlsx,.docx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mb-1 ml-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Attach file"
            >
              <Paperclip className="size-5" />
            </button>
            <input
              ref={inputRef}
              className="flex-1 resize-none border-0 bg-transparent px-2 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 max-h-32 overflow-y-auto"
              placeholder={hasMessages ? "Message CGU Copilot..." : "Ask about campus life, events, campus resources..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputValue.trim() && !uploadedFileId)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed pr-0.5"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            CGU Copilot is an AI assistant. Please verify critical information with official sources.
          </p>
        </div>
      </div>
    </div>
  )
}