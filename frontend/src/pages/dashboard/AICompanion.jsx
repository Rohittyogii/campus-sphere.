import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../../services/api';

// Lightweight markdown → HTML parser (no extra npm packages needed)
function renderMarkdown(text) {
  let html = text
    // Escape HTML entities first for safety
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^### (.+)$/gm, '<h4 style="color:#a78bfa;margin:0.75rem 0 0.25rem;font-size:0.95rem;font-weight:700;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#a78bfa;margin:0.75rem 0 0.25rem;font-size:1.05rem;font-weight:700;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="color:#a78bfa;margin:0.75rem 0 0.25rem;font-size:1.15rem;font-weight:700;">$1</h2>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:700;">$1</strong>')
    // Italic *text*
    .replace(/\*(.+?)\*/g, '<em style="color:#e2e8f0;">$1</em>')
    // Horizontal rule ---
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:0.75rem 0;" />')
    // Bullet points - item
    .replace(/^- (.+)$/gm, '<li style="margin:0.25rem 0;padding-left:0.25rem;">$1</li>')
    // Numbered list 1. item
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:0.25rem 0;padding-left:0.25rem;">$1</li>')
    // Wrap consecutive <li> elements in <ul>
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, '<ul style="padding-left:1.25rem;margin:0.5rem 0;list-style:disc;">$&</ul>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  return html;
}

const AICompanion = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am the **Campus Sphere AI**.\n\nAsk me anything — your name, your academics, clubs, open electives, IRO exchange programs, or campus rules!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/', { query: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting to the Knowledge Base right now.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in" style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h1>AI Companion</h1>
        <p>Powered by Mistral &amp; FAISS — trained on university internal data.</p>
      </div>

      <div className="bento-card glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>

        {/* Chat History */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              {/* Avatar */}
              <div className="avatar" style={{
                flexShrink: 0,
                background: msg.role === 'user' ? 'var(--color-accent-primary)' : 'var(--color-bg-highlight)',
                color: msg.role === 'user' ? '#fff' : 'var(--color-accent-secondary)'
              }}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              {/* Bubble */}
              <div style={{
                background: msg.role === 'user' ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                padding: '0.9rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                borderTopRightRadius: msg.role === 'user' ? '4px' : 'var(--radius-lg)',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : 'var(--radius-lg)',
                maxWidth: '75%',
                lineHeight: 1.7,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '0.92rem',
              }}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              <Loader2 size={18} className="spinner" /> AI is thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about the campus..."
              style={{ flexGrow: 1, borderRadius: 'var(--radius-full)', paddingLeft: '1.5rem' }}
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0 1.5rem' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AICompanion;
