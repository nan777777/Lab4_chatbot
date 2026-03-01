'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (content: string) => void
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
    const [content, setContent] = useState('')

    const handleSubmit = () => {
        onSubmit(content)
        setContent('')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Provide Feedback</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Please tell us what went wrong with this response
                    </p>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Feedback Content
                    </label>
                    <Textarea
                        placeholder="Please describe what went wrong or how we can improve..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[100px] resize-none"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
