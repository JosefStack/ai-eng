import { create } from "zustand";
import type { Message } from "../types/message";
// import apiInstance from "../lib/axios";

const API_URL = import.meta.env.VITE_API_URL

interface ChatStore {
    messages: Message[];
    isSending: boolean;
    sendMessage: (message: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    messages: [],
    isSending: false,

    sendMessage: async (message: string) => {
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: message,
        }

        const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
        }

        set((state) => ({
            messages: [...state.messages, userMessage],
            isSending: true,
        }))

        try {
            // const { data } = await apiInstance.post("/chat/", {
            //     messages: get().messages.map((message) => ({
            //         role: message.role,
            //         content: message.content,
            //     }))
            // }); 
            // axios doesnt work for server sent events (streaming), fetch works best for such cases

            const res = await fetch(`${API_URL}/chat/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: get().messages.map((message) => ({
                        role: message.role,
                        content: message.content,
                    }))
                })
            });

            if (!res.ok) throw new Error("Failed to send message");

            set((state) => ({
                messages: [...state.messages, assistantMessage],
            }))

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("Failed to receive message - No reader available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n\n").filter(Boolean);  

                for (const line of lines) {
                    const data = line.replace("data: ", "")
                    if (data == "[DONE]") break;

                    set((state) => {
                        const messages = [...state.messages];
                        const last = messages[messages.length - 1];
                        last.content += data;
                        return { messages }
                    })
                }

            }

        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            set({ isSending: false });
        }
    }
}))
