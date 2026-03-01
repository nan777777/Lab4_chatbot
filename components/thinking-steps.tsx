'use client'

import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { ThinkingStep } from '@/types/chat'

interface ThinkingStepsProps {
    steps: ThinkingStep[]
}

export function ThinkingSteps({ steps }: ThinkingStepsProps) {
    const [isOpen, setIsOpen] = useState(false)

    const meaningfulSteps = steps.filter(
        (s) => s.thought || s.tool || s.observation,
    )
    if (meaningfulSteps.length === 0) return null

    return (
        <div className="mb-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-red-50/50 bg-red-50 text-primary border border-red-100"
            >
                <Brain className="size-4" />
                {meaningfulSteps.length} Workflow Process{meaningfulSteps.length > 1 ? 'es' : ''}
                {isOpen ? (
                    <ChevronUp className="size-4" />
                ) : (
                    <ChevronDown className="size-4" />
                )}
            </button>

            {isOpen && (
                <div className="mt-3 space-y-3 border-l-2 pl-4 ml-2 border-red-100">
                    {meaningfulSteps.map((step, i) => (
                        <div key={i} className="text-sm space-y-1.5">
                            {step.tool && (
                                <div className="flex items-center gap-2 font-medium text-primary">
                                    <Search className="size-3.5" />
                                    <span>{step.tool}</span>
                                </div>
                            )}
                            {step.thought && (
                                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-[13px]">
                                    {step.thought}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
