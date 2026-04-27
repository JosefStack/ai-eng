import Groq from "groq-sdk";
import dotenv from "dotenv";
import readline from "readline";
import { getCryptoPrice, getCryptoHistory, getCoinId } from "./cryptoApi";

dotenv.config({ quiet: true });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const input = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
};

const messages: any[] = [
    {
        role: "system",
        content: "You are a helpful assistant with tools.\
You must follow these critical rules precisely:\
1. In case of tool usage, trust the data returned by the tools.\
2. Current you have one tool called getCryptoPrice which returns an object of the format {symbol, currency, price, note}, you must trust this completely and display the price from this object. Note: the price returned in this object is already in usd. Do not convert it.\
3. You must trust the price returned by the tool completely, it is the absolute truth. Do not trust training data if a tool call happens. "
    },

];

const tools: any[] = [
    {
        type: "function",
        function: {
            name: "getCoinId",
            description: "Get the CoinGecko API coin id for a cryptocurrency symbol. When other tools need coin id as an argument, first call this tool to retrieve it.",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description: "The symbol of the cyptocurrency to find the id of."
                    }
                },
                required: ["symbol"],
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getCryptoPrice",
            description: "Get the current price of a cryptocurrency based on the coin id. Use getCoinId to retrieve the coin id of a cryptocurrency. (e.g., bitcoin, ethereum).",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        description: "The CoinGecko API id of the cryptocurrency to fetch the price for."
                    }
                },
                required: ["id"],
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getCryptoHistory",
            description: "Get the historical price from of a cryptocurrency on a specific date by providing the CoinGekco API id for the cryptocurrency (e.g, bitcoin, ethereum). Use getCoinId to retrieve the coin id of a cryptocurrency.",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        descritpion: "The CoinGecko API id of the cryptocurrency to fetch the history for."
                    },
                    date: {
                        type: "string",
                        description: "he date in DD-MM-YYYY format (e.g., 01-01-2024)."
                    },
                },
                required: ["id", "date"],
            }
        }
    },
];

const available_functions: Record<string, (args: any) => Promise<any>> = {
    getCoinId: getCoinId,
    getCryptoPrice: getCryptoPrice,
    getCryptoHistory: getCryptoHistory
};

const executeToolCall = async (toolCall: any): Promise<any> => {
    const functionName = toolCall.function.name;
    const functionToCall = available_functions[functionName];
    const functionArgs = JSON.parse(toolCall.function.arguments);

    return await functionToCall(functionArgs)
}

const main = async () => {
    console.log("Chat started. Type 'exit' to quit.");

    while (true) {

        const userMessage = await input("\nYou: ");
        if (userMessage === "exit") {
            rl.close();
            break;
        }

        messages.push({ role: "user", content: userMessage });

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            tools,
            max_tokens: 1024,
        })

        const assistantMessage = response.choices[0]?.message;

        if (assistantMessage.tool_calls) {
            let currentMessage = assistantMessage;
            while (currentMessage.tool_calls) {
                messages.push({
                    role: "assistant",
                    tool_calls: currentMessage.tool_calls,
                });

                const toolResults = await Promise.all(
                    currentMessage.tool_calls.map(async (toolCall) => {
                        const result = await executeToolCall(toolCall);
                        return { toolCall, result };
                    })
                );

                for (const toolCall of toolResults) {
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.toolCall.id,
                        content: JSON.stringify(toolCall.result),
                    })
                };

                const nextResponse = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages,
                    tools,
                    max_tokens: 1024,
                });

                currentMessage = nextResponse.choices[0]?.message;
            }


            const finalContent = currentMessage.content || "";
            messages.push({
                role: "assistant",
                content: finalContent,
            })
            console.log("\nAssistant: ", finalContent);
            continue;
        };

        console.log("=== non tool response ; ===")
        messages.push({
            role: "assistant",
            content: assistantMessage.content,
        });
        console.log("\nAssistant: ", assistantMessage.content);

    };
};


main().catch(console.error);