'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTheme } from 'next-themes'
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Database,
  FileSearch,
  FileText,
  GitBranch,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Moon,
  Paperclip,
  PlayCircle,
  RotateCcw,
  Ruler,
  Scale,
  SearchCheck,
  Send,
  Sun,
  ThumbsDown,
  ThumbsUp,
  User,
  UsersRound,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FeedbackModal } from '@/components/feedback-modal'
import { SuggestionCards } from '@/components/suggestion-cards'
import { ThinkingSteps } from '@/components/thinking-steps'
import { Message, ThinkingStep } from '@/types/chat'

const DEMO_USER_ID = 'projmvp-6-ui-user'

const designFamilies = [
  { name: 'Staggered DID', signal: 'Treatment timing varies across units', icon: GitBranch },
  { name: 'RDD', signal: 'A cutoff determines treatment assignment', icon: Ruler },
  { name: 'IV', signal: 'A plausible instrument shifts treatment only', icon: KeyRound },
  { name: 'Matching', signal: 'Selection on observed covariates is plausible', icon: UsersRound },
]

const intakeFields = [
  { title: 'Causal question', text: 'What causes what, and for whom.' },
  { title: 'Treatment definition', text: 'The policy, exposure, or intervention.' },
  { title: 'Outcome measure', text: 'The result the design explains.' },
  { title: 'Unit of analysis', text: 'The level of observation.' },
  { title: 'Data structure', text: 'Cross-section, panel, or repeated data.' },
  { title: 'Treatment timing', text: 'When treatment starts or varies.' },
  { title: 'Comparison group', text: 'Untreated or not-yet-treated cases.' },
  { title: 'Institutional context', text: 'Rules and setting details that matter.' },
]

const outputBlocks = [
  {
    title: 'Recommended design family',
    text: 'A ranked recommendation of plausible causal designs.',
    icon: Scale,
  },
  {
    title: 'Why this design fits',
    text: 'A short explanation linking your setting to the design.',
    icon: SearchCheck,
  },
  {
    title: 'Identification assumptions',
    text: 'Key assumptions that must hold for credibility.',
    icon: Brain,
  },
  {
    title: 'Threats and red flags',
    text: 'Weaknesses, missing information, or design risks.',
    icon: AlertTriangle,
  },
  {
    title: 'Next-step checklist',
    text: 'Diagnostics, robustness checks, and follow-up questions.',
    icon: CalendarClock,
  },
]

const responsibilityStatement =
  'This tool provides design guidance, not final proof of causality. Verify assumptions with data, domain knowledge, and advisor review.'

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
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [outputOpen, setOutputOpen] = useState(false)

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [currentFeedbackMessageId, setCurrentFeedbackMessageId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasMessages = messages.length > 0
  const canSend = !isLoading && !isUploading && (!!inputValue.trim() || !!uploadedFileId)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (!messageId) return

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
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please upload a file under 10MB.')
      return
    }

    setSelectedFile(file)
    setIsUploading(true)

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

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadedFileId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (queryOverride?: string) => {
    const typedQuery = queryOverride ?? inputValue.trim()
    const query = typedQuery || 'Please analyze the attached research material and identify the most plausible causal design.'

    if ((!typedQuery && !uploadedFileId) || isLoading || isUploading) return

    const currentUploadedFileId = uploadedFileId
    const currentSelectedFile = selectedFile

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      files: currentSelectedFile
        ? [{ name: currentSelectedFile.name, type: currentSelectedFile.type, size: currentSelectedFile.size }]
        : undefined,
    }
    setMessages((prev) => [...prev, userMessage])
    setMessageCount((c) => c + 1)
    setInputValue('')
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
          files: currentUploadedFileId
            ? [{
              type: 'document',
              transfer_method: 'local_file',
              upload_file_id: currentUploadedFileId,
            }]
            : [],
        }),
      })

      if (!response.ok) {
        let message = `API error: ${response.status}`
        try {
          const errorBody = await response.json()
          if (errorBody?.error) message = errorBody.error
        } catch {
          // Keep the status-only message when the API route does not return JSON.
        }
        throw new Error(message)
      }
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullAnswer = ''
      const thoughtMap = new Map<number, ThinkingStep>()
      let convId = conversationId
      let difyMessageId = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

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
            } else if (event.type === 'error') {
              const errorText = event.message || 'The Dify workflow returned an error.'
              fullAnswer += `\n\nWorkflow error: ${errorText}`
              setStreamingContent(fullAnswer)
            }
          } catch {
            // Ignore malformed stream fragments.
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
        content: fullAnswer || 'I could not generate a design triage yet. Please add more detail about the treatment, timing, data structure, or comparison group.',
        thinkingSteps: allThoughts,
        messageId: difyMessageId,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setMessageCount((c) => c + 1)
    } catch (error) {
      console.error('Failed to send message:', error)
      const detail = error instanceof Error ? error.message : 'Unknown error'
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Something went wrong while contacting the design workflow.\n\n${detail}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingThoughts([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    setSelectedFile(null)
    setUploadedFileId(null)
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground transition-colors">
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {hasMessages && (
        <aside className="hidden w-[340px] shrink-0 flex-col border-r border-border bg-card/70 xl:flex">
          <div className="border-b border-border px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Scale className="size-6" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">Causal Design Assistant</h1>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden px-5 pb-4 pt-8">
            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <FileSearch className="size-4 text-primary" />
                Design Families
              </div>
              <div className="space-y-2">
                {designFamilies.map((family) => (
                  <div key={family.name} className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                    <family.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{family.name}</div>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{family.signal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-auto rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4" />
                Guardrail
              </div>
              <p className="mt-2 text-xs leading-5">
                The assistant does not force a recommendation when the research setting is incomplete. It will first ask for missing causal design details.
              </p>
            </section>
          </div>
        </aside>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground ${hasMessages ? 'xl:hidden' : ''}`}>
              <Scale className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold sm:text-base">
                {hasMessages ? 'Design Review' : 'Econometric Causal Design Assistant'}
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {hasMessages ? `${messageCount} messages in this design review` : 'Structured guidance before estimation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex size-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
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
                className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
              >
                <RotateCcw className="size-3.5" />
                New review
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <div className="mx-auto w-full max-w-[960px] px-4 py-8 lg:px-8">
              <section className="flex flex-col">
                <div className="w-full">
                  <h2 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                    Turn a rough research idea into a defensible identification plan.
                  </h2>
                  <p className="mt-4 max-w-[820px] text-base leading-7 text-muted-foreground">
                    Describe your causal question, treatment, outcome, data structure, timing, and comparison group. The assistant will recommend candidate causal designs, explain key assumptions, flag missing information, and suggest next diagnostic checks.
                  </p>
                  <div className="mt-7 w-full">
                    <div className="mb-2 text-lg font-semibold text-foreground">
                      Describe your research idea
                    </div>
                    {selectedFile && (
                      <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                        <div className="flex size-10 items-center justify-center rounded-md border border-border bg-background shadow-sm">
                          {isUploading ? (
                            <Loader2 className="size-5 animate-spin text-primary" />
                          ) : selectedFile.type.startsWith('image/') ? (
                            <ImageIcon className="size-5 text-primary" />
                          ) : (
                            <FileText className="size-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {isUploading ? 'Uploading to design workflow...' : `${(selectedFile.size / 1024).toFixed(1)} KB ready for analysis`}
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                          disabled={isUploading}
                          title="Remove attachment"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )}

                    <div className="relative flex min-h-20 items-end gap-3 rounded-lg border-2 border-emerald-700 bg-card px-3 py-3 shadow-sm transition-all hover:border-emerald-800 hover:shadow-md focus-within:border-emerald-800 focus-within:ring-4 focus-within:ring-emerald-700/15 dark:border-emerald-700 dark:hover:border-emerald-500 dark:hover:shadow-[0_0_24px_rgba(74,185,162,0.08)] dark:focus-within:border-emerald-500 dark:focus-within:ring-emerald-500/20">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.txt,.md,.csv,.xlsx,.docx,.pptx,image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mb-1 flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Attach codebook, memo, abstract, or notes"
                      >
                        <Paperclip className="size-5" />
                      </button>
                      <textarea
                        ref={inputRef}
                        className="max-h-40 min-h-14 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-4 text-base leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                        placeholder="Describe your causal question, treatment, outcome, data structure, timing, and comparison group..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={1}
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!canSend}
                        className="mb-1 flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Send to design assistant"
                      >
                        {isLoading ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : (
                          <Send className="size-5.5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      You can start with an incomplete idea. The assistant will ask follow-up questions if key design details are missing.
                    </p>
                  </div>
                </div>

                <div className="mt-10 w-full space-y-3">
                  <section className="rounded-lg border border-border bg-card/70 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setExamplesOpen((open) => !open)}
                      aria-expanded={examplesOpen}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <PlayCircle className="size-4" />
                          Try an Example
                        </div>
                      </div>
                      <ChevronDown
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${examplesOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {examplesOpen && (
                      <div className="border-t border-border px-4 pb-4 pt-3">
                        <SuggestionCards onSelect={handleSendMessage} />
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-border bg-card/70 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setIntakeOpen((open) => !open)}
                      aria-expanded={intakeOpen}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <Database className="size-4" />
                        Intake Checklist
                      </div>
                      <ChevronDown
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${intakeOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {intakeOpen && (
                      <div className="grid gap-4 border-t border-border px-4 pb-4 pt-4 sm:grid-cols-2">
                        {intakeFields.map((field) => (
                          <div
                            key={field.title}
                            className="flex items-start gap-3"
                          >
                            <Check className="mt-0.5 size-5 shrink-0 stroke-[1.5] text-muted-foreground" />
                            <div>
                              <h3 className="text-sm font-semibold leading-5 text-foreground">{field.title}</h3>
                              <p className="mt-1 text-sm leading-5 text-muted-foreground">{field.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-border bg-muted/30 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setOutputOpen((open) => !open)}
                      aria-expanded={outputOpen}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <SearchCheck className="size-4" />
                        What You Will Receive
                      </div>
                      <ChevronDown
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${outputOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {outputOpen && (
                      <div className="grid gap-4 border-t border-border px-4 pb-4 pt-4 sm:grid-cols-2">
                        {outputBlocks.map((block) => (
                          <div key={block.title} className="flex items-start gap-3">
                            <block.icon className="mt-0.5 size-6 shrink-0 stroke-[1.5] text-muted-foreground" />
                            <div>
                              <h3 className="text-sm font-semibold leading-5 text-foreground">{block.title}</h3>
                              <p className="mt-1 text-sm leading-5 text-muted-foreground">{block.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </section>

              <div className="mt-8 w-full">
                <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-1.5">
                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    {responsibilityStatement}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
              {messages.map((msg) => (
                <div key={msg.id} className="group">
                  {msg.role === 'user' ? (
                    <div className="flex items-start gap-4 flex-row-reverse">
                      <Avatar className="size-10 shrink-0 border-2 border-background shadow-sm">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex max-w-[84%] flex-col items-end gap-2">
                        {msg.files && msg.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                            <div className="flex size-10 items-center justify-center rounded-md border border-border bg-background">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="size-5 text-primary" />
                              ) : (
                                <FileText className="size-5 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                              <p className="text-xs uppercase text-muted-foreground">{file.type.split('/')[1] || 'file'}</p>
                            </div>
                          </div>
                        ))}

                        <div className="rounded-lg rounded-tr-sm bg-primary px-5 py-3.5 text-base leading-7 text-primary-foreground shadow-sm whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <Avatar className="size-10 shrink-0 rounded-lg border border-border shadow-sm">
                        <AvatarFallback className="bg-card text-primary">
                          <Scale className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[92%] space-y-2">
                        {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                          <ThinkingSteps steps={msg.thinkingSteps} />
                        )}
                        <div className="prose prose-neutral max-w-none rounded-lg border border-border bg-card px-5 py-4 text-base leading-7 dark:prose-invert">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        <div className={`mt-2 flex items-center gap-2 transition-opacity ${msg.feedback ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="size-4 text-green-600" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </button>

                          <div className="mx-1 h-4 w-px bg-border" />

                          {(!msg.feedback || msg.feedback === 'like') && (
                            <button
                              onClick={() => msg.messageId && !msg.feedback && handleRate(msg.messageId, 'like')}
                              disabled={!msg.messageId || !!msg.feedback}
                              className={`rounded-md p-1.5 transition-colors ${msg.feedback === 'like'
                                ? 'bg-green-50 text-green-700 dark:bg-green-950'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                              title="Good response"
                            >
                              <ThumbsUp className={`size-4 ${msg.feedback === 'like' ? 'fill-current' : ''}`} />
                            </button>
                          )}

                          {(!msg.feedback || msg.feedback === 'dislike') && (
                            <button
                              onClick={() => msg.messageId && !msg.feedback && handleRate(msg.messageId, 'dislike')}
                              disabled={!msg.messageId || !!msg.feedback}
                              className={`rounded-md p-1.5 transition-colors ${msg.feedback === 'dislike'
                                ? 'bg-red-50 text-red-700 dark:bg-red-950'
                                : 'text-muted-foreground hover:bg-muted'
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

              {isStreaming && (
                <div className="flex items-start gap-4">
                  <Avatar className="size-10 shrink-0 animate-pulse rounded-lg border border-border shadow-sm">
                    <AvatarFallback className="bg-card text-primary">
                      <Scale className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[92%] space-y-2">
                    {streamingThoughts.length > 0 && (
                      <ThinkingSteps steps={streamingThoughts} />
                    )}

                    {streamingContent ? (
                      <div className="prose prose-neutral max-w-none rounded-lg border border-border bg-card px-5 py-4 text-base leading-7 dark:prose-invert">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span className="font-medium">Evaluating design fit...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {hasMessages && (
          <div className="border-t border-border bg-background/92 px-4 py-4 backdrop-blur-lg">
            <div className="mx-auto max-w-4xl">
              {selectedFile && (
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex size-10 items-center justify-center rounded-md border border-border bg-background shadow-sm">
                    {isUploading ? (
                      <Loader2 className="size-5 animate-spin text-primary" />
                    ) : selectedFile.type.startsWith('image/') ? (
                      <ImageIcon className="size-5 text-primary" />
                    ) : (
                      <FileText className="size-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isUploading ? 'Uploading to design workflow...' : `${(selectedFile.size / 1024).toFixed(1)} KB ready for analysis`}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                    disabled={isUploading}
                    title="Remove attachment"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              <div className="relative flex items-end gap-2 rounded-lg border border-emerald-700 bg-card p-2 shadow-sm transition-all hover:border-emerald-800 focus-within:border-emerald-800 focus-within:ring-2 focus-within:ring-emerald-700/15 dark:border-emerald-900/70 dark:hover:border-emerald-800 dark:focus-within:border-emerald-800 dark:focus-within:ring-emerald-800/35">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.md,.csv,.xlsx,.docx,.pptx,image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-1 flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Attach codebook, memo, abstract, or notes"
                >
                  <Paperclip className="size-5" />
                </button>
                <textarea
                  ref={inputRef}
                  className="max-h-36 min-h-12 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-3 text-base leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                  placeholder="Add details or answer a diagnostic question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  rows={1}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!canSend}
                  className="mb-1 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Send to design assistant"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Send className="size-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
