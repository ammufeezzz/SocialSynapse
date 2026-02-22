let Supadata;
let client = null;

async function getClient() {
    if (!client) {
        if (!Supadata) {
            const module = await import('@supadata/js');
            Supadata = module.Supadata;
        }
        const apiKey = process.env.SUPADATA_API_KEY;
        if (!apiKey) {
            throw new Error('SUPADATA_API_KEY not set in .env');
        }
        client = new Supadata({ apiKey });
    }
    return client;
}

function detectPlatform(url) {
    if (/youtube\.com|youtu\.be/i.test(url)) return 'YouTube';
    if (/instagram\.com/i.test(url)) return 'Instagram';
    if (/tiktok\.com/i.test(url)) return 'TikTok';
    if (/twitter\.com|x\.com/i.test(url)) return 'X (Twitter)';
    if (/facebook\.com|fb\.watch/i.test(url)) return 'Facebook';
    if (/reddit\.com/i.test(url)) return 'Reddit';
    if (/linkedin\.com/i.test(url)) return 'LinkedIn';
    if (/medium\.com/i.test(url)) return 'Medium';
    return 'Other';
}

const WEB_PLATFORMS = ['Reddit', 'LinkedIn', 'Medium', 'Other'];

function extractHashtags(text) {
    if (!text) return [];
    const matches = text.match(/#\w+/g);
    return matches ? [...new Set(matches)] : [];
}

function extractUrl(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const match = text.match(urlRegex);
    return match ? match[1] : null;
}

async function extractContent(url) {
    const supadata = await getClient();
    const platform = detectPlatform(url);

    if (WEB_PLATFORMS.includes(platform)) {
        return await extractWebContent(supadata, url, platform);
    } else {
        return await extractVideoContent(supadata, url, platform);
    }
}

async function extractWebContent(supadata, url, platform) {
    let title = null;
    let description = null;

    try {
        const scraped = await supadata.web.scrape(url);
        title = scraped.title || null;
        description = scraped.content || scraped.markdown || null;
    } catch (err) {
        console.error('Web scrape failed:', err.message);
    }

    const hashtags = extractHashtags(description);

    return {
        platform,
        url,
        title,
        author: null,
        description: description || null,
        transcript: null,
        hashtags,
    };
}

async function extractVideoContent(supadata, url, platform) {
    let metadata = null;
    let transcript = null;

    try {
        metadata = await supadata.metadata({ url });
    } catch (err) {
        console.error('Metadata extraction failed:', err.message);
    }

    try {
        const result = await supadata.transcript({ url, text: true });
        if ('jobId' in result) {
            transcript = `[Processing... Job ID: ${result.jobId}]`;
        } else {
            transcript = result.content || result.text || null;
        }
    } catch (err) {
        console.error('Transcript extraction failed:', err.message);
    }

    const description = metadata?.description || '';
    const hashtags = extractHashtags(description);

    return {
        platform,
        url,
        title: metadata?.title || null,
        author: metadata?.author || metadata?.channel || null,
        description: description || null,
        transcript: transcript || null,
        hashtags,
    };
}

module.exports = { extractContent, extractUrl, detectPlatform };
