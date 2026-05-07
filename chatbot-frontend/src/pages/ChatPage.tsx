import ChatHeader from "../components/ChatHeader"
import ChatInput from "../components/ChatInput"
import ChatMessages from "../components/ChatMessages"
import { useChatStore } from "../store/ChatStore"



const ChatPage = () => {
    const { messages } = useChatStore()
    return (
        <div className="bg-[#1A1A1B] h-screen w-screen px-4 py-2 flex flex-col ">
            <ChatHeader />
            <ChatMessages messages={messages} />
            <ChatInput />
        </div>
    )
}

export default ChatPage
