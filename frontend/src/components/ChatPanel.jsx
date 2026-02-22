import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';

const API = 'http://localhost:3000';

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hey! I\'m your SocialSynapse AI. Ask me anything about your saved posts — like "What did I save about fitness?" or "Summarize my tech posts."' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0)
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.text }));

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer || 'Sorry, I couldn\'t process that.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cyan-400 text-black
            flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)]
            hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] hover:scale-105
            transition-all duration-300 cursor-pointer">
          <FaComments size={22} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[520px] rounded-2xl border border-white/10
          flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.1)]"
          style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}>

          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-white font-medium text-sm">SocialSynapse AI</span>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white transition-colors cursor-pointer">
              <FaTimes size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                  ${msg.role === 'user' ? 'bg-cyan-400/20' : 'bg-white/10'}`}>
                  {msg.role === 'user'
                    ? <FaUser size={10} className="text-cyan-400" />
                    : <FaRobot size={10} className="text-white/60" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-cyan-400/15 text-white border border-cyan-400/20'
                    : 'bg-white/5 text-white/80 border border-white/5'}`}>
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <FaRobot size={10} className="text-white/60" />
                </div>
                <div className="bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="px-3 py-3 border-t border-white/10">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2
              focus-within:border-cyan-400/30 transition-all duration-300">
              <input
                type="text"
                placeholder="Ask about your saved posts..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="bg-transparent text-white text-xs outline-none w-full placeholder:text-white/30 disabled:opacity-50"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer disabled:opacity-30">
                <FaPaperPlane size={12} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
