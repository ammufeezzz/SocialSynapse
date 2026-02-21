const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
    if (!supabase) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_KEY;
        if (!url || !key) {
            throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in .env');
        }
        supabase = createClient(url, key);
    }
    return supabase;
}

async function savePost(content) {
    const { data, error } = await getClient()
        .from('saved_posts')
        .insert({
            url: content.url,
            platform: content.platform,
            title: content.title,
            description: content.description,
            transcript: content.transcript,
            hashtags: content.hashtags || [],
            ai_summary: content.ai_summary || null,
            ai_category: content.ai_category || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Database save error:', error.message);
        throw error;
    }

    console.log(`Saved post #${data.id} to database`);
    return data;
}

async function getPosts() {
    const { data, error } = await getClient()
        .from('saved_posts')
        .select('*')
        .order('saved_at', { ascending: false });

    if (error) throw error;
    return data;
}

module.exports = { savePost, getPosts };
