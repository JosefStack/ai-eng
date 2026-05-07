import { Send } from "lucide-react"
import { useState } from "react"
import { useChatStore } from "../store/ChatStore"

const ChatInput = () => {

    const [input, setInput] = useState("")
    const { sendMessage } = useChatStore()
    


    return (
        <div className="rounded-full border border-zinc-600">
            <form 
            className="px-4 py-3 flex-1 position-relative flex items-center gap-2"
            onSubmit={(e) => {
                e.preventDefault()
                if (!input.trim()) return
                sendMessage(input)
                setInput("")
            }}
            >
                <input 
                type="text" 
                value={input}
                onChange = {(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full h-full text-white border-none outline-none focus:ring-0"
                />

                <button type="submit">
                    <Send className="text-white"/>
                </button>
            </form>
        </div>
    )
}

export default ChatInput
