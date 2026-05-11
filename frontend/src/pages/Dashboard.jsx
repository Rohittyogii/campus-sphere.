import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  Coffee,
  MapPin,
  Globe,
  Bell,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Sparkles,
  Send,
  MessageSquare,
  Compass
} from 'lucide-react';
import api from '../services/api';
import Overview from './dashboard/Overview';
import Library from './dashboard/Library';
import Cafe from './dashboard/Cafe';
import Clubs from './dashboard/Clubs';
import Events from './dashboard/Events';
import IRO from './dashboard/IRO';
import Timetable from './dashboard/Timetable';
import LostFound from './dashboard/LostFound';
import Community from './dashboard/Community';
import OpenElectives from './dashboard/OpenElectives';
import Feedback from './dashboard/Feedback';
import Specialization from './dashboard/Specialization';
import Placement from './dashboard/Placement';
import './Dashboard.css';
import sidebarLogo from '../assets/NCU-Logo.svg';

/* ═══════════════════════════════════════════════════════════════════
   Dashboard Shell
   ═══════════════════════════════════════════════════════════════════ */

const PAGE_TITLES = {
  '/': { title: 'Overview', subtitle: 'Your campus at a glance' },
  '/library': { title: 'Library', subtitle: 'Books, search & your issued items' },
  '/cafe': { title: 'Café', subtitle: 'Menu, picks & daily combos' },
  '/clubs': { title: 'Clubs & Societies', subtitle: 'Discover campus communities' },
  '/events': { title: 'Events & Hackathons', subtitle: 'Competitions and campus activities' },
  '/iro': { title: 'IRO Portal', subtitle: 'International exchange programs' },
  '/lost-found': { title: 'Lost & Found', subtitle: 'Report and reclaim lost items' },
  '/timetable': { title: 'Timetable', subtitle: 'Your weekly class schedule' },
  '/community': { title: 'Community Wall', subtitle: 'Share updates with the campus' },
  '/open-electives': { title: 'Open Electives', subtitle: 'Explore interdisciplinary courses' },
  '/feedback': { title: 'Feedback', subtitle: 'Help us improve your campus experience' },
  '/specialization': { title: 'PathFinder', subtitle: 'Discover your ideal academic track' },
  '/placement': { title: 'Placement AI', subtitle: 'AI-powered career guidance & interview prep' },
};


const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your Campus AI. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = PAGE_TITLES[location.pathname] || { title: 'Campus Sphere', subtitle: '' };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setProfile(res.data);
        fetchNotifications();
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/chat/', { query: userMsg });
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!profile) return <div className="loading-screen">Loading Campus Sphere…</div>;

  const navItems = [
    { section: 'WORKSPACE' },
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/community', label: 'Community', icon: Globe, badge: 'NEW' },
    { path: '/clubs', label: 'Clubs', icon: Users },

    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/cafe', label: 'Cafe', icon: Coffee },
    { path: '/timetable', label: 'Timetable', icon: Calendar },
    { path: '/lost-found', label: 'Lost & Found', icon: MapPin },
    { path: '/open-electives', label: 'Open Electives', icon: BookOpen },
    { path: '/iro', label: 'IRO', icon: Globe },
    { path: '/specialization', label: 'PathFinder', icon: Compass },
    { path: '/placement', label: 'Placement AI', icon: Sparkles, badge: 'AI' },
    { path: '/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const initials = profile.student_name
    ? profile.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CS';

  return (
    <div className={`dashboard-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ─── NCU Branded Sidebar ──────────────────────────────────────── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-btn"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="sidebar-header">
          <h2 style={{ marginBottom: 0, opacity: 1, transition: 'opacity 0.2s' }}>
            <img 
              src={sidebarLogo} 
              alt="Logo" 
              className="brand-logo"
            />
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
                <span style={{ fontSize: '16px' }}>Campus Sphere</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0', textTransform: 'none' }}>NorthCap University</span>
              </div>
            )}
          </h2>
        </div>

        <nav className="nav-menu">
          {navItems.map((item, idx) => {
            if (item.section) {
              return !collapsed && <div key={`s-${idx}`} className="nav-section-label">{item.section}</div>;
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={collapsed ? item.label : ""}
              >
                <div className="nav-icon">
                  <item.icon size={18} />
                </div>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className={`nav-badge ${item.badge.toLowerCase() === 'ai' ? 'ai' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item logout-btn" style={{ background: 'transparent' }}>
            <div className="nav-icon"><LogOut size={18} /></div>
            {!collapsed && <span>Log out</span>}
          </button>

        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="main-content">
        <header className="top-header">
          <div className="top-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="#F58220" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div style={{ height: '16px', width: '1px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="top-header-title" style={{ fontSize: '14px', marginBottom: 0 }}>{currentPage.title}</h1>
                <p className="top-header-subtitle" style={{ fontSize: '11px', marginTop: '2px' }}>{currentPage.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="top-header-right" style={{ position: 'relative' }}>
            <div style={{ textAlign: 'right', marginRight: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#231F20', lineHeight: 1.2 }}>{profile.student_name}</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>{profile.roll_no || '21CSU234'}</div>
            </div>
            <button 
              className="header-icon-btn" 
              title="Notifications" 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{ background: 'transparent', width: '32px', height: '32px', position: 'relative' }}
            >
              <Bell size={18} color="#231F20" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '0px', right: '0px', background: '#f43f5e', color: '#fff', fontSize: '8px', fontWeight: 800, padding: '2px 4px', borderRadius: '50%', border: '1px solid #fff' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="fade-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '320px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Mark all read</button>
                  )}
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      <Bell size={24} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                      <div style={{ fontSize: '0.85rem' }}>No notifications yet</div>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc', background: n.is_read ? '#fff' : '#8b5cf605', transition: 'background 0.2s' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.is_read ? 'transparent' : '#8b5cf6', marginTop: '6px' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', marginBottom: '0.25rem', textAlign: 'left' }}>{n.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4, textAlign: 'left' }}>{n.message}</div>
                            <div style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: '0.5rem', textAlign: 'left' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <div className="header-avatar" style={{ width: '36px', height: '36px', background: '#F58220' }}>
              {initials}
            </div>
          </div>
        </header>

        <div className="main-scroll">
          <Routes>
            <Route path="/" element={<Overview profile={profile} />} />
            <Route path="/library" element={<Library profile={profile} />} />
            <Route path="/cafe" element={<Cafe profile={profile} />} />
            <Route path="/clubs" element={<Clubs profile={profile} />} />
            <Route path="/events" element={<Events profile={profile} />} />
            <Route path="/iro" element={<IRO profile={profile} />} />
            <Route path="/timetable" element={<Timetable profile={profile} />} />
            <Route path="/lost-found" element={<LostFound profile={profile} />} />
            <Route path="/community" element={<Community profile={profile} />} />
            <Route path="/open-electives" element={<OpenElectives profile={profile} />} />
            <Route path="/feedback" element={<Feedback profile={profile} />} />
            <Route path="/specialization" element={<Specialization profile={profile} />} />
            <Route path="/placement" element={<Placement profile={profile} />} />
          </Routes>

        </div>
      </main>

      {/* ─── Floating AI Chatbot ───────────────────────────────────────── */}
      <button 
        className={`ai-fab ${isChatOpen ? 'open' : ''}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        title="Campus AI Assistant"
      >
        {isChatOpen ? <Menu size={24} /> : <Sparkles size={24} />}
      </button>

      {isChatOpen && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div className="ai-chat-header-icon">
              <Sparkles size={20} />
            </div>
            <div className="ai-chat-header-info">
              <h3>Campus Assistant</h3>
              <p>Online & Ready to help</p>
            </div>
          </div>

          <div className="ai-chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`ai-msg-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="ai-typing">
                <div className="ai-typing-dots">
                  <span></span><span></span><span></span>
                </div>
                Assistant is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="ai-chat-input-area">
            <form onSubmit={handleChatSubmit}>
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isTyping}
              />
              <button type="submit" disabled={isTyping || !chatInput.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
