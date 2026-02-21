const twilio = require('twilio');

let client = null;

function getClient() {
    if (!client) {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;

        if (!sid || !sid.startsWith('AC') || !token) {
            throw new Error(
                'Twilio credentials not configured. ' +
                'Set TWILIO_ACCOUNT_SID (starts with AC) and TWILIO_AUTH_TOKEN in your .env file.'
            );
        }

        client = twilio(sid, token);
    }
    return client;
}

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;


async function sendMessage(to, body) {
    try {
        const message = await getClient().messages.create({
            from: TWILIO_WHATSAPP_NUMBER,
            to,
            body,
        });
        console.log(`Message sent to ${to} | SID: ${message.sid}`);
        return message;
    } catch (error) {
        console.error(`Failed to send message to ${to}:`, error.message);
        throw error;
    }
}

module.exports = { sendMessage };
