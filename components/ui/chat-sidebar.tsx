'use client'

import * as React from 'react'
import { Plus, MessageSquare, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatHistoryItem {
    id: string
    title: string
    active?: boolean
}

interface Lab4ChatSidebarProps {
    isOpen: boolean
    onToggle: () => void
    chatHistory: ChatHistoryItem[]
    onNewChat: () => void
    onSelectChat: (id: string) => void
}

export function Lab4ChatSidebar({
    isOpen,
    onToggle,
    chatHistory,
    onNewChat,
    onSelectChat,
}: Lab4ChatSidebarProps) {
    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    'flex h-full flex-col transition-all duration-300',
                    isOpen ? 'w-64' : 'w-0 overflow-hidden',
                )}
                style={{ backgroundColor: '#1a1a1a', color: '#eaeaea' }}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <img
                            src="/images/cgu-chatbot.png"
                            alt="CGU Bot"
                            className="size-7 rounded-full"
                        />
                        <span className="text-sm font-semibold">CGU Chatbot</span>
                    </div>
                    <button
                        onClick={onToggle}
                        className="rounded-md p-1 transition-colors"
                        style={{ color: '#eaeaea' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <PanelLeftClose className="size-4" />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="px-3 pb-3">
                    <button
                        onClick={onNewChat}
                        className="flex w-full items-center justify-start gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                        style={{ backgroundColor: '#ac1b28' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8e1622')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ac1b28')}
                    >
                        <Plus className="size-4" />
                        New Chat
                    </button>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto px-3">
                    <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>
                        History
                    </p>
                    <div className="space-y-1">
                        {chatHistory.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat(chat.id)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                )}
                                style={{
                                    backgroundColor: chat.active ? '#2a2a2a' : 'transparent',
                                    color: chat.active ? '#eaeaea' : '#aaa',
                                }}
                                onMouseEnter={(e) => {
                                    if (!chat.active) {
                                        e.currentTarget.style.backgroundColor = '#222'
                                        e.currentTarget.style.color = '#eaeaea'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!chat.active) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.color = '#aaa'
                                    }
                                }}
                            >
                                <MessageSquare className="size-4 shrink-0" />
                                <span className="truncate">{chat.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="px-4 py-3" style={{ borderTop: '1px solid #333' }}>
                    <p className="text-xs" style={{ color: '#555' }}>
                        Powered by CGU AI Lab
                    </p>
                </div>
            </aside>

            {/* Toggle button when sidebar is closed */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="absolute left-3 top-4 z-10 rounded-md p-2 hover:bg-muted transition-colors"
                >
                    <PanelLeft className="size-5" />
                </button>
            )}
        </>
    )
}
