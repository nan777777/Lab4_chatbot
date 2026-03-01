'use client'

import { GraduationCap, BookOpen, HelpCircle } from 'lucide-react'

const suggestions = [
    {
        icon: GraduationCap,
        title: 'Campus Life',
        subtitle: 'Parking',
        query: 'How Can I get a CGU Parking Pass?',
    },
    {
        icon: BookOpen,
        title: 'Campus Events',
        subtitle: 'Club Activities',
        query: 'Which clubs are available on campus to engage in my hobbies and make friends?',
    },
    {
        icon: HelpCircle,
        title: 'Campus Resources',
        subtitle: 'Mental Health Resources',
        query: 'What CGU campus resources are available for mental health support, and how do I book an appointment as a graduate student?',
    },
]

interface SuggestionCardsProps {
    onSelect: (query: string) => void
}

export function SuggestionCards({ onSelect }: SuggestionCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl w-full">
            {suggestions.map((s, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(s.query)}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-red-200 dark:hover:border-red-900 hover:shadow-md hover:-translate-y-0.5"
                >
                    <div
                        className="flex size-10 items-center justify-center rounded-xl transition-colors group-hover:bg-primary group-hover:text-primary-foreground bg-red-50 text-primary dark:bg-primary/10"
                    >
                        <s.icon className="size-5" />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-card-foreground">{s.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{s.subtitle}</p>
                    </div>
                </button>
            ))}
        </div>
    )
}
