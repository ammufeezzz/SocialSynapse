require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const { sendMessage } = require('./utils/whatsapp');
const { extractContent, extractUrl } = require('./utils/supadata');
const { generateSummaryAndTags, generateEmbedding } = require('./utils/groq');
const { savePost, getPosts } = require('./utils/database');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

            
            if (!content.title && !content.description && !content.transcript) {
                await sendMessage(From, `Couldn't extract content from that link. The page might be private, restricted, or unsupported. Try a different link!`);
                return res.status(200).send('OK');
            }

            const { title, summary, category } = await generateSummaryAndTags(content);
            if (!content.title || content.title.trim() === '') {
                content.title = title;
            }
            content.ai_summary = summary;
            content.ai_category = category;

            console.log(content);

            await savePost(content);

            const embeddingText = [content.title, content.ai_summary, content.description].filter(Boolean).join(' ');
            const embedding = await generateEmbedding(embeddingText);
            if (embedding) {
                const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
                const { data: latest } = await supabase.from('saved_posts').select('id').order('saved_at', { ascending: false }).limit(1).single();
                if (latest) {
                    await supabase.from('saved_posts').update({ embedding: JSON.stringify(embedding) }).eq('id', latest.id);
                }
            }

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



app.get('/posts', async (req, res) => {
    try {
        const { platform, search } = req.query;
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        let query = supabase.from('saved_posts').select('*').order('saved_at', { ascending: false });

        if (platform && platform !== 'All') {
            query = query.eq('platform', platform);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,ai_summary.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/stats', async (req, res) => {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { data, error } = await supabase.from('saved_posts').select('platform, ai_category');
        if (error) throw error;

        const platforms = {};
        const categories = {};
        data.forEach(post => {
            platforms[post.platform] = (platforms[post.platform] || 0) + 1;
            if (post.ai_category) {
                categories[post.ai_category] = (categories[post.ai_category] || 0) + 1;
            }
        });

        res.json({ total: data.length, platforms, categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/posts/:id', async (req, res) => {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { error } = await supabase.from('saved_posts').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

        const embedding = await generateEmbedding(q);
        if (!embedding) return res.status(500).json({ error: 'Failed to generate query embedding' });

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { data, error } = await supabase.rpc('match_posts', {
            query_embedding: JSON.stringify(embedding),
            match_count: 20,
        });
        if (error) throw error;

        

        if (data.length === 0) return res.json([]);

        
        const minScore = 0.35;

        let maxGap = 0;
        let cutIndex = data.length;
        for (let i = 1; i < data.length; i++) {
            const gap = data[i - 1].similarity - data[i].similarity;
            if (gap > maxGap) {
                maxGap = gap;
                cutIndex = i;
            }
        }

        
        if (maxGap < 0.015) cutIndex = data.length;

        const filtered = data.slice(0, cutIndex).filter(p => p.similarity >= minScore);
        console.log(`  → largest gap: ${maxGap.toFixed(3)} at index ${cutIndex}, showing ${filtered.length}/${data.length}`);
        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.post('/chat', async (req, res) => {
    try {
        const { question, history = [] } = req.body;
        if (!question) return res.status(400).json({ error: 'Question is required' });

       
        const embedding = await generateEmbedding(question);
        let context = '';
        if (embedding) {
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
            const { data } = await supabase.rpc('match_posts', {
                query_embedding: JSON.stringify(embedding),
                match_count: 5,
            });
            if (data && data.length > 0) {
                context = data
                    .filter(p => p.similarity > 0.35)
                    .map((p, i) => `[Post ${i + 1}] (${p.platform}) ${p.title || 'Untitled'}\nSummary: ${p.ai_summary || 'N/A'}\nDescription: ${(p.description || '').substring(0, 500)}\nURL: ${p.url}`)
                    .join('\n\n');
            }
        }

        
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const systemPrompt = `You are the SocialSynapse AI assistant — a helpful second brain assistant. 
The user has saved social media posts and you can answer questions about them.
${context ? `\nHere are the user's relevant saved posts:\n${context}` : '\nNo relevant saved posts were found for this question.'}

Rules:
- Answer based on the saved content when relevant
- If no saved posts match, say so honestly
- Be concise and helpful
- Reference specific posts when answering (mention the platform and title)
- If the user asks something unrelated to their saved content, you can still help but mention you're not pulling from their saves
- NEVER use markdown formatting (no **, no ##, no bullets). Write in plain conversational text only.`;

        const conversationHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text,
        }));

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory,
                { role: 'user', content: question },
            ],
            temperature: 0.7,
        });

        const answer = response.choices[0].message.content;
        res.json({ answer });
    } catch (err) {
        console.error('Chat error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/collections', async (req, res) => {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { data, error } = await supabase.from('saved_posts').select('*').order('saved_at', { ascending: false });
        if (error) throw error;

        const collections = {};
        data.forEach(post => {
            const cat = post.ai_category || 'Uncategorized';
            if (!collections[cat]) collections[cat] = { name: cat, count: 0, posts: [] };
            collections[cat].count++;
            collections[cat].posts.push(post);
        });

        res.json(Object.values(collections).sort((a, b) => b.count - a.count));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.get('/digest', async (req, res) => {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

       
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: posts, error } = await supabase
            .from('saved_posts')
            .select('*')
            .gte('saved_at', weekAgo)
            .order('saved_at', { ascending: false });
        if (error) throw error;

        if (posts.length === 0) {
            return res.json({
                summary: 'No posts saved this week. Send some links via WhatsApp to get started!',
                stats: { total: 0, platforms: {}, categories: {} },
                posts: [],
            });
        }

        
        const platforms = {};
        const categories = {};
        posts.forEach(p => {
            platforms[p.platform] = (platforms[p.platform] || 0) + 1;
            if (p.ai_category) categories[p.ai_category] = (categories[p.ai_category] || 0) + 1;
        });

        
        const postSummaries = posts.map((p, i) =>
            `${i + 1}. [${p.platform}] ${p.title || 'Untitled'} — ${p.ai_summary || p.description || 'No summary'}`
        ).join('\n');

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{
                role: 'user',
                content: `Generate a brief, engaging weekly digest for a user's saved social media content. Write in plain text, no markdown.

Here are the ${posts.length} posts saved this week:
${postSummaries}

Write a short 3-4 sentence digest covering: what topics they focused on, any patterns, and a fun insight. Keep it conversational and concise.`
            }],
            temperature: 0.7,
        });

        res.json({
            summary: response.choices[0].message.content,
            stats: { total: posts.length, platforms, categories },
            posts: posts,
        });
    } catch (err) {
        console.error('Digest error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


app.get('/inspiration', async (req, res) => {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        
        const { count, error: countErr } = await supabase.from('saved_posts').select('*', { count: 'exact', head: true });
        if (countErr) throw countErr;
        if (count === 0) return res.status(404).json({ error: 'No posts saved yet' });

        
        const randomIndex = Math.floor(Math.random() * count);
        const { data: posts, error: fetchErr } = await supabase
            .from('saved_posts')
            .select('*')
            .range(randomIndex, randomIndex)
            .single();
        if (fetchErr) throw fetchErr;

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{
                role: 'user',
                content: `You are SocialSynapse AI. Give a very brief (1-2 sentences), inspiring reason why the user should revisit this saved post. 
                
                Title: ${posts.title || 'Untitled'}
                Summary: ${posts.ai_summary || posts.description || 'No summary'}
                Platform: ${posts.platform}
                
                Be punchy, motivational, and conversational. Don't use markdown.`
            }],
            temperature: 0.8,
        });

        res.json({
            post: posts,
            tip: response.choices[0].message.content
        });
    } catch (err) {
        console.error('Inspiration error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
