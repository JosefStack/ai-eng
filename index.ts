import Groq from "groq-sdk";
import dotenv from "dotenv";
import readline from "readline";
import { getCryptoPrice, getCryptoHistory } from "./cryptoApi";

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
            name: "getCryptoPrice",
            description: "Get the current price of a cryptocurrency symbol (e.g., BTC, ETH, XAUUSD).",
            parameters: {
                type: "object",
                properties: {
                    crypto: {
                        type: "string",
                        description: "The symbol of the cryptocurrency to fetch the price for."
                    }
                },
                required: ["crypto"],
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getCryptoHistory",
            description: "Get all of the available history for the slug of a cryptocurrency (e.g, bitcoin, binance-coin, usd-coin).",
            parameters: {
                type: "object",
                properties: {
                    slug: {
                        type: "string",
                        descritpion: "The slug of the cryptocurrency to fetch the history for."
                    },
                },
                required: ["slug"],
            }
        }
    },
];

const available_functions: Record<string, (args: any) => Promise<any>> = {
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
            messages.push({
                role: "assistant",
                tool_calls: assistantMessage.tool_calls,
            });

            const toolResults = await Promise.all(
                assistantMessage.tool_calls.map(async (toolCall) => {
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

            const finalResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages,
                tools,
                max_tokens: 1024,
            });

            const finalContent = finalResponse.choices[0]?.message?.content || "";
            messages.push({
                role: "assistant",
                content: finalContent,
            })
            console.log("\nAssistant: ", finalContent);
            console.log("== DEBUG == FINAL CONTENT ==: ", finalContent);
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