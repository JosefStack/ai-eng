import { create } from "zustand";
import type { Message } from "../types/message";
import apiInstance from "../lib/axios";

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

        set((state) => ({
            messages: [...state.messages, userMessage],
            isSending: true,
        }))

        try {
            const { data } = await apiInstance.post("/chat/", {
                messages: get().messages.map((message) => ({
                    role: message.role,
                    content: message.content,
                }))
            });

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.response,
            }

            set((state) => ({
                messages: [...state.messages, assistantMessage],
            }));

            console.log(get().messages)

        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            set({ isSending: false });
        }
    }
}))
