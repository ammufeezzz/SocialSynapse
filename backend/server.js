require('dotenv').config();
const express = require('express');
const { sendMessage } = require('./utils/whatsapp');
const { extractContent, extractUrl } = require('./utils/supadata');
const { generateSummaryAndTags } = require('./utils/gemini');
const { savePost } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'SocialSynapse WhatsApp Backend' });
});

app.post('/webhook', async (req, res) => {
    const { From, Body } = req.body;
    const url = extractUrl(Body || '');

    try {
        if (url) {
            await sendMessage(From, `Extracting content from your link...\n${url}`);

            const content = await extractContent(url);

            const { summary, category } = await generateSummaryAndTags(content);
            content.ai_summary = summary;
            content.ai_category = category;

            console.log(content);

            await savePost(content);

            let reply = `*${content.platform} Content Saved*\n`;
            if (content.ai_summary) reply += `\n${content.ai_summary}`;

            await sendMessage(From, reply);
        } else {
            await sendMessage(From, `Hey! Send me a social media link (YouTube, Instagram, TikTok, etc.) and I'll extract the content for you.`);
        }
    } catch (err) {
        console.error('Webhook error:', err.message);
        await sendMessage(From, `Something went wrong while processing your link. Please try again.`).catch(() => { });
    }

    res.status(200).send('OK');
});

app.post('/send', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({
            error: 'Missing required fields: "to" and "message"',
            example: {
                to: 'whatsapp:+911234567890',
                message: 'Hello from SocialSynapse!'
            }
        });
    }

    try {
        const result = await sendMessage(to, message);
        res.json({
            success: true,
            messageSid: result.sid,
            to: result.to,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
