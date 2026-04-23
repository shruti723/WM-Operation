"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
    submissionId: string
    user: any
    siteName?: string
    onClose: () => void
}

export default function ChatDrawer({ submissionId, user, siteName, onClose }: Props) {
    const [messages, setMessages] = useState<any[]>([])
    const [text, setText] = useState("")
    const bottomRef = useRef<HTMLDivElement | null>(null)

    const fetchMessages = async () => {
        const res = await fetch(`/api/chat/get?submissionId=${submissionId}`)

        if (!res.ok) {
            console.error("API Error:", res.status)
            setMessages([])
            return
        }

        const data = await res.json()

        if (Array.isArray(data)) {
            setMessages(data)
        } else {
            console.error("Invalid response:", data)
            setMessages([])
        }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [submissionId])

    // ✅ Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const sendMessage = async () => {
        if (!text.trim() || !user?.id) return

        await fetch("/api/chat/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                submissionId,
                message: text,
                senderId: user.id,
                senderRole: user.role,
            }),
        })

        setText("")
        fetchMessages()
    }

    function formatTime(date: string) {
        const d = new Date(date)
        return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <>
            {/* 🔴 Overlay */}
            <div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[380px] bg-white shadow-xl flex flex-col z-50">

                {/* HEADER */}
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h2 className="font-semibold text-lg">Site Discussion</h2>
                        <p className="text-xs text-gray-500 truncate max-w-[250px]">
                            {siteName || "Unknown Site"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black"
                    >
                        ✖
                    </button>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 mt-10">
                            No messages yet 👋
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMine = msg.senderId === user?.id

                        return (
                            <div
                                key={msg.id}
                                className={`max-w-[75%] p-3 rounded-2xl text-sm shadow ${isMine
                                    ? "bg-blue-600 text-white ml-auto"
                                    : "bg-white border mr-auto"
                                    }`}
                            >
                                <div className="text-xs opacity-70 mb-1">
                                    {isMine ? "You" : msg.sender?.name || msg.senderRole}
                                </div>

                                <div>{msg.message}</div>

                                <div className={`text-[10px] mt-1 ${isMine ? "text-white/70" : "text-gray-500"
                                    } text-right`}>
                                    {formatTime(msg.createdAt)}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* INPUT */}
                <div className="p-3 border-t flex gap-2 bg-white sticky bottom-0">
                    <input
                        className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage()
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-full text-sm"
                    >
                        Send
                    </button>
                </div>
            </div>
        </>
    )
}