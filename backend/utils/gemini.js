let GoogleGenAI;
let ai = null;

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
    const ai = await getAI();

    const textParts = [];
    if (content.title) textParts.push(`Title: ${content.title}`);
    if (content.description) textParts.push(`Description: ${content.description}`);
    if (content.transcript) textParts.push(`Transcript: ${content.transcript.substring(0, 2000)}`);

    if (textParts.length === 0) {
        return { summary: null, category: null };
    }

    const prompt = `You are an AI assistant for a social media content organizer called SocialSynapse.

Given the following ${content.platform} post content, provide:
1. A concise summary (2-3 sentences max)
2. A single category that best describes this content (e.g., Tech, Cooking, Fitness, Finance, Entertainment, Education, Music, Travel, Fashion, Gaming, Science, etc.)

Content:
${textParts.join('\n')}

Respond in this exact JSON format only, no markdown:
{"summary": "your summary here", "category": "Category"}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });




        const text = response.text.trim();
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(jsonStr);

        return {
            summary: result.summary || null,
            category: result.category || null,
        };
    } catch (err) {
        console.error('Gemini AI error:', err.message);
        return { summary: null, category: null };
    }
}

module.exports = { generateSummaryAndTags };
