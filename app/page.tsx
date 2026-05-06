'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTheme } from 'next-themes'
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  Check,
  ClipboardList,
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
  ShieldCheck,
  Sparkles,
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

const workflowStages = [
  {
    label: 'Structured intake',
    detail: 'Question, unit, treatment, outcome, timing, data structure',
    icon: ClipboardList,
  },
  {
    label: 'Parallel design triage',
    detail: 'MVP scope: DID, RDD, IV, and Matching',
    icon: SearchCheck,
  },
  {
    label: 'Diagnostics',
    detail: 'Assumptions, threats, red flags, and next analytical steps',
    icon: ShieldCheck,
  },
]

const designFamilies = [
  { name: 'Staggered DID', signal: 'Treatment timing varies across units', icon: GitBranch },
  { name: 'RDD', signal: 'A cutoff determines treatment assignment', icon: Ruler },
  { name: 'IV', signal: 'A plausible instrument shifts treatment only', icon: KeyRound },
  { name: 'Matching', signal: 'Selection on observed covariates is plausible', icon: UsersRound },
]

const intakeFields = [
  'Causal question',
  'Treatment definition',
  'Outcome measure',
  'Unit of analysis',
  'Data structure',
  'Treatment timing',
  'Comparison group',
  'Institutional context',
]

const outputBlocks = [
  {
    title: 'Recommended design family',
    text: 'A ranked recommendation with confidence and alternatives.',
    icon: Scale,
  },
  {
    title: 'Identification assumptions',
    text: 'The logic that must hold before estimation makes sense.',
    icon: Brain,
  },
  {
    title: 'Threats and red flags',
    text: 'Where the design can fail, including missing information.',
    icon: AlertTriangle,
  },
  {
    title: 'Next-step checklist',
    text: 'Diagnostics such as pre-trends, manipulation checks, or balance.',
    icon: CalendarClock,
  },
]

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
                <h1 className="truncate text-base font-semibold">Econometric design triage</h1>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" />
                Workflow
              </div>
              <div className="space-y-3">
                {workflowStages.map((stage, index) => (
                  <div key={stage.label} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <stage.icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {index + 1}. {stage.label}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

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

            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4" />
                Guardrail
              </div>
              <p className="mt-2 text-xs leading-5">
                When evidence is incomplete, the assistant should ask for missing design features instead of forcing a recommendation.
              </p>
            </section>
          </div>
        </aside>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground xl:hidden">
              <Scale className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold sm:text-base">
                Econometric Causal Design Assistant
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
            <div className="mx-auto grid min-h-full w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
              <section className="flex flex-col justify-center">
                <div className="mb-7 max-w-3xl">
                  <h2 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                    Turn a rough research idea into a defensible identification plan.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                    Describe the policy, treatment timing, dataset, and comparison group. The assistant will rank candidate designs, challenge assumptions, and surface diagnostics before you run a model.
                  </p>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <PlayCircle className="size-4 text-primary" />
                        Demo cases
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ready-to-run examples with complete intake details.
                      </p>
                    </div>
                    <span className="rounded-md border border-emerald-700/40 bg-emerald-950/10 px-2 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-950/50 dark:text-emerald-100">
                      Clickable
                    </span>
                  </div>
                  <SuggestionCards onSelect={handleSendMessage} />
                </div>

                <div className="mt-8">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Database className="size-4 text-primary" />
                    Intake checklist
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {intakeFields.map((field) => (
                      <div
                        key={field}
                        className="cursor-default rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground"
                      >
                        {field}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="flex flex-col justify-center">
                <div className="rounded-lg border border-border bg-muted/30 p-5 shadow-none">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <SearchCheck className="size-4" />
                      Expected output
                    </div>
                    <span className="rounded-md border border-border bg-background/70 px-2 py-1 text-xs font-medium text-muted-foreground">
                      Reference only
                    </span>
                  </div>

                  <div className="pointer-events-none select-none">
                    <div className="grid grid-cols-2 gap-x-5 gap-y-6">
                      {outputBlocks.map((block) => (
                        <div key={block.title} className="text-center">
                          <block.icon className="mx-auto size-11 stroke-[1.5] text-muted-foreground" />
                          <h3 className="mx-auto mt-3 max-w-32 text-sm font-semibold leading-5 text-foreground">
                            {block.title}
                          </h3>
                          <p className="mx-auto mt-1 max-w-36 text-xs leading-5 text-muted-foreground">
                            {block.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
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

            <div className="relative flex items-end gap-2 rounded-lg border border-border bg-card p-2 shadow-sm transition-all hover:border-input focus-within:ring-2 focus-within:ring-primary/20">
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
                placeholder={hasMessages ? 'Add details or answer a diagnostic question...' : 'Describe your causal question, treatment, outcome, unit, data structure, and timing...'}
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
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Recommendations are design triage, not proof of identification. Verify assumptions with data, domain evidence, and instructor or advisor review.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
