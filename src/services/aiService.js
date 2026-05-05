const Groq = require('groq-sdk');
const logger = console;

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 4000;

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'get_current_datetime',
            description: "Returns the current server date and time in the requested format. Use this whenever the user asks about the current time, today's date, or needs a timestamp for relative references like 'now', 'today', or 'right now'. Do NOT use this for past or future dates — it always returns the present moment.",
            parameters: {
                type: 'object',
                properties: {
                    date_format: {
                        type: 'string',
                        enum: ['iso', 'unix', 'locale'],
                        description: "Output format. Use 'iso' for ISO 8601 string (best for machine parsing or storage). Use 'unix' for seconds since epoch as an integer (best for arithmetic on durations). Use 'locale' for a human-readable string (best for display to the end user).",
                        default: 'iso',
                    },
                },
                required: [],
                additionalProperties: false,
            },
        },
    },
];

class AIService {
    addUserMessage(messages, text) {
        messages.push({ role: 'user', content: text });
    }

    addAssistantMessage(messages, text) {
        messages.push({ role: 'assistant', content: text });
    }

    async chat(messages, system = null, temperature = 1.0) {
        try {
            const allMessages = system
                ? [{ role: 'system', content: system }, ...messages]
                : messages;

            const response = await client.chat.completions.create({
                model: MODEL,
                messages: allMessages,
                max_tokens: MAX_TOKENS,
                temperature,
            });

            return response.choices[0]?.message?.content || '';
        } catch (error) {
            logger.error('Error in chat:', error);
            throw error;
        }
    }

    async *chatStream(messages, system = null, temperature = 1.0) {
        try {
            const allMessages = system
                ? [{ role: 'system', content: system }, ...messages]
                : messages;

            const stream = await client.chat.completions.create({
                model: MODEL,
                messages: allMessages,
                max_tokens: MAX_TOKENS,
                temperature,
                stream: true,
            });

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content;
                if (delta) {
                    yield delta;
                }
            }
        } catch (error) {
            logger.error('Error in chatStream:', error);
            throw error;
        }
    }

    getCurrentDateTime(date_format = 'iso') {
        const now = new Date();
        switch (date_format) {
            case 'iso': return now.toISOString();
            case 'unix': return Math.floor(now.getTime() / 1000);
            case 'locale': return now.toLocaleString();
            default:
                throw new Error(`Unsupported date_format: ${date_format}`);
        }
    }

    executeToolCall(name, args) {
        switch (name) {
            case 'get_current_datetime':
                return this.getCurrentDateTime(args.date_format);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    async chatWithTools(messages, system = null, maxIterations = 5) {
        for (let i = 0; i < maxIterations; i++) {
            const allMessages = system
                ? [{ role: 'system', content: system }, ...messages]
                : messages;

            const response = await client.chat.completions.create({
                model: MODEL,
                messages: allMessages,
                max_tokens: MAX_TOKENS,
                tools: TOOLS,
            });

            const choice = response.choices[0];
            const assistantMsg = choice.message;

            messages.push(assistantMsg);

            if (choice.finish_reason !== 'tool_calls' || !assistantMsg.tool_calls?.length) {
                return assistantMsg.content || '';
            }

            for (const call of assistantMsg.tool_calls) {
                let result;
                try {
                    const args = JSON.parse(call.function.arguments || '{}');
                    result = this.executeToolCall(call.function.name, args);
                } catch (err) {
                    logger.error('Tool execution failed', {
                        tool: call.function.name,
                        error: err.message,
                    });
                    result = `Error: ${err.message}`;
                }
                messages.push({
                    role: 'tool',
                    tool_call_id: call.id,
                    content: String(result),
                });
            }
        }
        throw new Error(`chatWithTools exceeded max iterations (${maxIterations})`);
    }

    async generateText(prompt) {
        const messages = [];
        this.addUserMessage(messages, prompt);
        return this.chat(messages, null, 0.7);
    }
}

module.exports = new AIService();
