import type { Message } from "../types/message"

interface Props {
    messages: Message[]
}


const ChatMessages = ({ messages }: Props) => {
    return (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-4">
            {messages.map((message) => (
                <div
                key={message.id}
                className={`${message.role === "user" ? "self-end rounded-br-none" : "self-start rounded-bl-none"}
                text-white bg-zinc-700 rounded-3xl px-4 py-2 max-w-xs
                `}
                >{message.content}</div>
            ))}
        </div>
    )
}

export default ChatMessages
