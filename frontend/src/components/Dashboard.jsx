import { useState, useEffect } from 'react';
import { FaYoutube, FaInstagram, FaTiktok, FaTwitter, FaFacebook, FaReddit, FaLinkedin, FaPinterest, FaMediumM, FaGlobe, FaTrash, FaExternalLinkAlt, FaSearch, FaArrowLeft, FaNewspaper, FaThLarge, FaLightbulb, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';

const API = 'http://localhost:3000';

const platformIcons = {
  YouTube: { icon: FaYoutube, color: '#FF0000' },
  Instagram: { icon: FaInstagram, color: '#E4405F' },
  TikTok: { icon: FaTiktok, color: '#00f2ea' },
  'X (Twitter)': { icon: FaTwitter, color: '#1DA1F2' },
  Facebook: { icon: FaFacebook, color: '#1877F2' },
  Reddit: { icon: FaReddit, color: '#FF4500' },
  LinkedIn: { icon: FaLinkedin, color: '#0A66C2' },
  Pinterest: { icon: FaPinterest, color: '#E60023' },
  Medium: { icon: FaMediumM, color: '#ffffff' },
  Other: { icon: FaGlobe, color: '#00e5ff' },
};

const platformFilters = ['All', 'YouTube', 'Instagram', 'X (Twitter)', 'LinkedIn', 'Reddit', 'Medium'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ total: 0, platforms: {}, categories: {} });
  const [activePlatform, setActivePlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [inspiration, setInspiration] = useState(null);
  const [insLoading, setInsLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [activePlatform, searchQuery]);

  async function fetchPosts() {
    setLoading(true);
    try {
      let data;
      if (searchQuery) {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(searchQuery)}`);
        data = await res.json();
        if (activePlatform !== 'All') {
          data = data.filter(p => p.platform === activePlatform);
        }
      } else {

        const params = new URLSearchParams();
        if (activePlatform !== 'All') params.set('platform', activePlatform);
        const res = await fetch(`${API}/posts?${params}`);
        data = await res.json();
      }
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
    setLoading(false);
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  async function deletePost(id) {
    setDeleting(id);
    try {
      await fetch(`${API}/posts/${id}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
    setDeleting(null);
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearchQuery(searchInput);
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  }

  async function fetchDigest() {
    setDigestLoading(true);
    try {
      const res = await fetch(`${API}/digest`);
      const data = await res.json();
      setDigest(data);
    } catch (err) {
      console.error('Failed to fetch digest:', err);
    }
    setDigestLoading(false);
  }

  async function getInspiration() {
    setInsLoading(true);
    try {
      const res = await fetch(`${API}/inspiration`);
      const data = await res.json();
      setInspiration(data);
    } catch (err) {
      console.error('Failed to fetch inspiration:', err);
    }
    setInsLoading(false);
  }

  const topCategory = Object.entries(stats.categories)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const recommendedPosts = topCategory
    ? posts.filter(p => p.ai_category === topCategory).slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <ChatPanel />
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => {
              if (searchQuery || activePlatform !== 'All') {
                setSearchQuery(''); setSearchInput(''); setActivePlatform('All');
              } else {
                navigate('/');
              }
            }}
            className="text-white/50 hover:text-cyan-400 transition-colors cursor-pointer">
            <FaArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-xl font-bold text-white">Social</span>
            <span className="text-xl font-bold text-cyan-400">Synapse</span>
          </div>
          
          <button 
            onClick={getInspiration}
            disabled={insLoading}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-lg text-sm font-medium
              hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer">
            <FaLightbulb className={insLoading ? 'animate-pulse' : ''} size={14} />
            {insLoading ? 'Finding...' : 'Inspiration'}
          </button>

          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2
            focus-within:border-cyan-400/50 focus-within:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all duration-300 w-80">
            <FaSearch className="text-white/30" size={14} />
            <input
              type="text"
              placeholder="Search your saved posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/30"
            />
          </form>
          <div className="text-white/40 text-sm">
            {stats.total} post{stats.total !== 1 ? 's' : ''} saved
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Platform Filter Chips */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {platformFilters.map(p => (
            <button key={p} onClick={() => setActivePlatform(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer
                ${activePlatform === p
                  ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-cyan-400/30 hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-lg w-fit">
          {[{ id: 'posts', icon: FaThLarge, label: 'Posts' },
            { id: 'digest', icon: FaNewspaper, label: 'Weekly Digest' }].map(tab => (
            <button key={tab.id} onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'digest' && !digest) fetchDigest();
            }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 cursor-pointer
                ${activeTab === tab.id
                  ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'text-white/50 hover:text-white'}`}>
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* For You Section */}
        {activeTab === 'posts' && recommendedPosts.length > 0 && activePlatform === 'All' && !searchQuery && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
              <span className="text-cyan-400">⚡</span> For You
              <span className="text-xs text-white/30 font-normal ml-2">Your most saved: {topCategory}</span>
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {recommendedPosts.map(post => (
                <PostCard key={`rec-${post.id}`} post={post} compact onDelete={deletePost} deleting={deleting} timeAgo={timeAgo} />
              ))}
            </div>
          </section>
        )}

        {/* All Posts Grid */}
        {activeTab === 'posts' && (
          <section>
            <h2 className="text-lg font-semibold text-white/80 mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : activePlatform === 'All' ? 'All Posts' : `${activePlatform} Posts`}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/30">
                <p className="text-lg mb-2">No posts found</p>
                <p className="text-sm">Save some links via WhatsApp to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onDelete={deletePost} deleting={deleting} timeAgo={timeAgo} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Weekly Digest View */}
        {activeTab === 'digest' && (
          <section>
            <h2 className="text-lg font-semibold text-white/80 mb-6 flex items-center gap-2">
              <FaNewspaper className="text-cyan-400" size={16} /> Weekly Digest
              <span className="text-xs text-white/30 font-normal ml-2">AI-powered summary</span>
            </h2>
            {digestLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : digest ? (
              <div className="space-y-6">
                {/* AI Summary Card */}
                <div className="bg-gradient-to-br from-cyan-400/10 to-purple-500/10 border border-cyan-400/20
                  rounded-xl p-6 shadow-[0_0_30px_rgba(0,229,255,0.05)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-400 text-sm font-medium">AI Insights</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{digest.summary}</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{digest.stats.total}</p>
                    <p className="text-white/40 text-xs mt-1">Posts This Week</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{Object.keys(digest.stats.platforms).length}</p>
                    <p className="text-white/40 text-xs mt-1">Platforms Used</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{Object.keys(digest.stats.categories).length}</p>
                    <p className="text-white/40 text-xs mt-1">Topics Covered</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">
                      {Object.entries(digest.stats.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Top Category</p>
                  </div>
                </div>

                {/* Platform breakdown */}
                {Object.keys(digest.stats.platforms).length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                    <h3 className="text-white/60 text-sm font-medium mb-3">Platform Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(digest.stats.platforms).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="text-white/50 text-xs w-20">{name}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-400/40"
                              style={{ width: `${(count / digest.stats.total) * 100}%` }} />
                          </div>
                          <span className="text-white/40 text-xs w-6 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-white/30">
                <p className="text-lg mb-2">No digest available</p>
                <p className="text-sm">Something went wrong generating your digest.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Inspiration Modal */}
      {inspiration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setInspiration(null)} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[100px] pointer-events-none" />
            
            <button 
              onClick={() => setInspiration(null)}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
              <FaTimes size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black">
                <FaLightbulb size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Random Inspiration</h3>
                <p className="text-white/40 text-xs">AI-picked for you to revisit</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">{inspiration.post.platform}</span>
                {inspiration.post.ai_category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{inspiration.post.ai_category}</span>
                )}
              </div>
              <h4 className="text-lg font-medium text-white mb-2 leading-snug">{inspiration.post.title || 'Untitled'}</h4>
              <p className="text-white/50 text-sm line-clamp-3 italic">"{inspiration.post.ai_summary || inspiration.post.description || 'No summary available.'}"</p>
            </div>

            <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-xl p-5 mb-8">
              <p className="text-cyan-200 text-sm leading-relaxed font-medium">✨ {inspiration.tip}</p>
            </div>

            <div className="flex gap-4">
              <a 
                href={inspiration.post.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-cyan-400 transition-all">
                <FaExternalLinkAlt size={12} />
                Open Post
              </a>
              <button 
                onClick={getInspiration}
                className="flex-1 flex items-center justify-center gap-2 border border-white/10 text-white/60 py-3 rounded-xl font-bold text-sm hover:bg-white hover:text-black transition-all">
                Another One
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, compact, onDelete, deleting, timeAgo }) {
  const platform = platformIcons[post.platform] || platformIcons.Other;
  const PlatformIcon = platform.icon;

  return (
    <div className={`group bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 
      hover:border-cyan-400/20 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(0,229,255,0.05)]
      transition-all duration-300 flex flex-col gap-3
      ${compact ? 'min-w-[300px] max-w-[320px] flex-shrink-0' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlatformIcon style={{ color: platform.color }} size={16} />
          <span className="text-white/40 text-xs">{post.platform}</span>
        </div>
        <div className="flex items-center gap-2">
          {post.ai_category && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              {post.ai_category}
            </span>
          )}
          <span className="text-white/25 text-xs">{timeAgo(post.saved_at)}</span>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-white font-medium text-sm leading-snug line-clamp-2">
          {post.title}
        </h3>
      )}

      {/* Summary */}
      {post.ai_summary && (
        <p className="text-white/45 text-xs leading-relaxed line-clamp-3">
          {post.ai_summary}
        </p>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.slice(0, 5).map((tag, i) => (
            <span key={i} className="text-[10px] text-cyan-400/60 bg-cyan-400/5 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <a href={post.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white/30 hover:text-cyan-400 text-xs transition-colors">
          <FaExternalLinkAlt size={10} />
          Open
        </a>
        <button
          onClick={() => onDelete(post.id)}
          disabled={deleting === post.id}
          className="flex items-center gap-1.5 text-white/20 hover:text-red-400 text-xs transition-colors cursor-pointer disabled:opacity-50">
          <FaTrash size={10} />
          {deleting === post.id ? 'Deleting...' : 'Remove'}
        </button>
      </div>
    </div>
  );
}
