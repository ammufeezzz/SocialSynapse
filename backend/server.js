require('dotenv').config();
const express = require('express');
const { sendMessage } = require('./utils/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));  
app.use(express.json());                          

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'SocialSynapse WhatsApp Backend' });
});

app.post('/webhook', async (req, res) => {
    const { From, Body, MessageSid } = req.body;
    try {
        await sendMessage(From, `Got your message: "${Body}"\n\nWe'll process your link shortly!`);
    } catch (err) {
        console.error('Failed to send auto-reply:', err.message);
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
