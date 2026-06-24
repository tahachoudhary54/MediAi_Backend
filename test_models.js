import 'dotenv/config';
import OpenAI from 'openai';

const testXAI = async () => {
    try {
        const xaiVisionClient = new OpenAI({
            apiKey: process.env.XAI_API_KEY,
            baseURL: 'https://api.x.ai/v1',
        });

        const response = await xaiVisionClient.chat.completions.create({
            model: 'grok-vision-beta',
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 10
        });
        console.log('xAI success:', response.choices[0].message.content);
    } catch (e) {
        console.error('xAI error:', e.message);
    }
};

const testGroq = async () => {
    try {
        const groqClient = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
        });

        const response = await groqClient.chat.completions.create({
            model: 'llama-3.2-11b-vision-preview',
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 10
        });
        console.log('Groq 11b preview success');
    } catch (e) {
        console.error('Groq 11b preview error:', e.message);
    }

    try {
        const groqClient = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
        });

        const response = await groqClient.chat.completions.create({
            model: 'llama-3.2-90b-vision-preview',
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 10
        });
        console.log('Groq 90b preview success');
    } catch (e) {
        console.error('Groq 90b preview error:', e.message);
    }
};

testXAI().then(() => testGroq());
