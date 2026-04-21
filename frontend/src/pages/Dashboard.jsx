import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Compass, BookOpen,
  Coffee, Users, Calendar, Globe, User, Search,
  Sparkles, Send, Bot, Loader2, Plus, X
} from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

import Overview from './dashboard/Overview';
import Recommendations from './dashboard/Recommendations';
import Library from './dashboard/Library';
import Cafe from './dashboard/Cafe';
import Clubs from './dashboard/Clubs';
import Events from './dashboard/Events';
import IRO from './dashboard/IRO';
import LostFound from './dashboard/LostFound';

/* ═══════════════════════════════════════════════════════════════════
   Lightweight markdown → HTML (for AI chat bubbles)
   ═══════════════════════════════════════════════════════════════════ */
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h4 style="color:#4338ca;margin:0.6rem 0 0.2rem;font-size:0.88rem;font-weight:700;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#4338ca;margin:0.6rem 0 0.2rem;font-size:0.95rem;font-weight:700;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="color:#4338ca;margin:0.6rem 0 0.2rem;font-size:1.05rem;font-weight:700;">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:0.5rem 0;" />')
    .replace(/^- (.+)$/gm, '<li style="margin:0.15rem 0;">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:0.15rem 0;">$1</li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, '<ul style="padding-left:1.1rem;margin:0.4rem 0;list-style:disc;">$&</ul>')
    .replace(/\n/g, '<br/>');
}

/* ═══════════════════════════════════════════════════════════════════
   Floating AI Chat Component
   ═══════════════════════════════════════════════════════════════════ */
const FloatingAIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi there! 👋 I\'m your **Campus Sphere AI**.\n\nAsk me anything about academics, clubs, open electives, events, or campus rules!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div className="ai-chat-header-icon">
              <Sparkles size={18} />
            </div>
            <div className="ai-chat-header-info">
              <h3>Campus AI</h3>
              <p>Powered by Mistral & FAISS</p>
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`ai-msg-bubble ${msg.role}`}
              >
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  msg.content
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-typing">
                <div className="ai-typing-dots">
                  <span /><span /><span />
                </div>
                AI is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-chat-input-area">
            <form onSubmit={handleSend}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !input.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        className={`ai-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title={open ? 'Close AI Chat' : 'Ask AI'}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Dashboard Shell
   ═══════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setProfile(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!profile) return <div className="loading-screen">Loading Campus Sphere…</div>;

  const navItems = [
    { section: 'Main' },
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/recommendations', label: 'For You', icon: Compass, badge: 'New' },
    { section: 'Campus' },
    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/cafe', label: 'Café', icon: Coffee },
    { path: '/clubs', label: 'Clubs', icon: Users },
    { path: '/events', label: 'Events', icon: Calendar },
    { section: 'Services' },
    { path: '/iro', label: 'IRO Portal', icon: Globe },
    { path: '/lost-found', label: 'Lost & Found', icon: Search },
  ];

  const initials = profile.student_name
    ? profile.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CS';

  return (
    <div className="dashboard-layout">
      {/* ─── Clean White Sidebar ──────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>
            <span className="brand-dot">CS</span>
            <span>Campus Sphere</span>
          </h2>
        </div>

        <nav className="nav-menu">
          {navItems.map((item, idx) => {
            if (item.section) {
              return <div key={`s-${idx}`} className="nav-section-label">{item.section}</div>;
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{profile.student_name}</span>
              <span className="user-roll">{profile.roll_no}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Overview profile={profile} />} />
          <Route path="/recommendations" element={<Recommendations profile={profile} />} />
          <Route path="/library" element={<Library profile={profile} />} />
          <Route path="/cafe" element={<Cafe profile={profile} />} />
          <Route path="/clubs" element={<Clubs profile={profile} />} />
          <Route path="/events" element={<Events profile={profile} />} />
          <Route path="/iro" element={<IRO profile={profile} />} />
          <Route path="/lost-found" element={<LostFound profile={profile} />} />
        </Routes>
      </main>

      {/* ─── Floating AI Chat ─────────────────────────────────────────── */}
      <FloatingAIChat />
    </div>
  );
};

export default Dashboard;
