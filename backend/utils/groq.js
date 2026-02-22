const Groq = require('groq-sdk');

let GoogleGenAI;
let ai = null;
let groq = null;

function getGroq() {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY not set in .env');
        }
        groq = new Groq({ apiKey });
    }
    return groq;
}

async function getAI() {
    if (!ai) {
        if (!GoogleGenAI) {
            const module = await import('@google/genai');
            GoogleGenAI = module.GoogleGenAI;
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set in .env');
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

async function generateSummaryAndTags(content) {
    const client = getGroq();

    const textParts = [];
    if (content.title) textParts.push(`Title: ${content.title}`);
    if (content.description) textParts.push(`Description: ${content.description}`);
    if (content.transcript) textParts.push(`Transcript: ${content.transcript.substring(0, 2000)}`);

    if (textParts.length === 0) {
        return { summary: null, category: null };
    }

    const prompt = `You are an AI assistant for a social media content organizer called SocialSynapse.

Given the following ${content.platform} post content, provide:
1. A short, descriptive title (5-10 words max)
2. A concise summary (2-3 sentences max)
3. A single category that best describes this content (e.g., Tech, Cooking, Fitness, Finance, Entertainment, Education, Music, Travel, Fashion, Gaming, Science, etc.)

Content:
${textParts.join('\n')}

Respond in this exact JSON format only, no markdown:
{"title": "your title here", "summary": "your summary here", "category": "Category"}`;

    try {
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        });

        const text = response.choices[0].message.content.trim();
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(jsonStr);

        return {
            title: result.title || null,
            summary: result.summary || null,
            category: result.category || null,
        };
    } catch (err) {
        console.error('Groq AI error:', err.message);
        return { title: null, summary: null, category: null };
    }
}

async function generateEmbedding(text) {
    const ai = await getAI();
    try {
        const result = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: text.substring(0, 5000),
            config: { outputDimensionality: 768 },
        });
        return result.embeddings[0].values;
    } catch (err) {
        console.error('Embedding error:', err.message);
        return null;
    }
}

module.exports = { generateSummaryAndTags, generateEmbedding };
