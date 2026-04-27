
import Groq from "groq-sdk";
import dotenv from "dotenv";
import readline from "readline";


dotenv.config({ quiet: true });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const input = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    })
}

const messages: { role: "user" | "system" | "assistant", content: string }[] = [
    {
        role: "system",
        content: "You are a helpful assistant."
    },
]

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
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages,
            max_tokens: 1024,
            stream: true,
        });

        process.stdout.write("\nAssistant: ");
        let assistantMessage = "";

        for await (const chunk of response) {
            const token = chunk.choices[0]?.delta?.content || "";
            process.stdout.write(token);
            assistantMessage += token;
        }

        process.stdout.write("\n");
        messages.push({ role: "assistant", content: assistantMessage })
    }
};

main().catch(console.error)


