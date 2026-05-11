import React, { useEffect, useState, useMemo } from 'react';
import { Search, MapPin, Phone, Clock, CheckCircle, AlertCircle, Plus, Rss, ClipboardList, Package, Layers, Filter, ArrowRight, ShieldCheck, Camera, X, ChevronRight, CheckCircle2, User } from 'lucide-react';

import api from '../../services/api';

const CATEGORIES = ['All', 'Electronics', 'Documents', 'Personal', 'Bags', 'Keys', 'Other'];
const CAT_META = {
  Electronics: { icon: Package, bg: '#fff7ed', color: '#f97316' },
  Documents: { icon: ClipboardList, bg: '#fef2f2', color: '#ef4444' },
  Personal: { icon: Layers, bg: '#fdf4ff', color: '#d946ef' },
  Bags: { icon: Package, bg: '#eff6ff', color: '#3b82f6' },
  Keys: { icon: ShieldCheck, bg: '#ecfdf5', color: '#10b981' },
  Other: { icon: Filter, bg: '#f8fafc', color: '#64748b' },
};

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api/v1', '');

const SleekCard = ({ children, style, className }) => (

  <div
    className={className}
    style={{
      background: '#fff',
      borderRadius: '24px',
      border: '1px solid #eef2f6',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }}
    onMouseOver={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
    }}
    onMouseOut={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
    }}
  >
    {children}
  </div>
);

const StatBadge = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '24px',
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    flex: 1,
    minWidth: '220px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    transition: 'all 0.3s ease'
  }}
    onMouseOver={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)';
    }}
    onMouseOut={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)';
    }}
  >
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '18px',
      background: `${color}10`,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 8px 16px ${color}15`
    }}>
      <Icon size={26} />
    </div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.4rem' }}>{label}</div>
    </div>
  </div>
);

const LostFound = () => {
  const [feed, setFeed] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [tab, setTab] = useState('feed');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    item_type: 'lost',
    title: '',
    description: '',
    category: 'Electronics',
    location_found: '',
    contact_info: '',
    image_url: ''
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/community/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, image_url: res.data.url }));
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const fetchData = async () => {

    setLoading(true);
    try {
      const [feedRes, myRes] = await Promise.all([api.get('/lost-found/'), api.get('/lost-found/my-posts')]);
      setFeed(feedRes.data);
      setMyPosts(myRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleClaim = async (id) => {
    try {
      await api.put(`/lost-found/${id}/claim`);
      setSuccess('Item status updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lost-found/report', form);
      setSuccess('Report submitted successfully!');
      setShowReportForm(false);
      setTimeout(() => setSuccess(null), 4000);
      setTab('my_posts');
      setForm({ item_type: 'lost', title: '', description: '', category: 'Electronics', location_found: '', contact_info: '', image_url: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const stats = useMemo(() => ({
    total: feed.length,
    lost: feed.filter(i => i.item_type === 'lost').length,
    found: feed.filter(i => i.item_type === 'found').length,
    claimed: feed.filter(i => i.status === 'claimed').length
  }), [feed]);

  const source = tab === 'feed' ? feed : myPosts;
  const filtered = source.filter(item => {
    const matchCat = category === 'All' || item.category === category;
    const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const [selectedItem, setSelectedItem] = useState(null);

  const ItemCard = ({ item }) => {
    const isLost = item.item_type === 'lost';
    const meta = CAT_META[item.category] || CAT_META.Other;

    return (
      <div style={{
        width: '100%',
        height: '480px',
        background: item.image_url ? '#f8fafc' : `linear-gradient(135deg, ${meta.color}10 0%, ${meta.color}20 100%)`,
        borderRadius: '32px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        position: 'relative',
        cursor: 'pointer',
        border: '1px solid #eef2f6',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
        onClick={() => setSelectedItem(item)}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
        }}
      >
        {item.image_url ? (
          <img src={`${BASE_URL}/${item.image_url.replace(/^\//, '')}`} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
            <div style={{ padding: '2rem', borderRadius: '30%', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
              <meta.icon size={64} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, opacity: 0.2, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{item.category}</div>
          </div>
        )}

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent 70%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2rem',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            position: 'absolute', top: '1.5rem', left: '1.5rem', padding: '0.6rem 1.5rem', borderRadius: '99px',
            background: isLost ? '#fee2e2' : '#dcfce7', color: isLost ? '#ef4444' : '#22c55e',
            fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {item.item_type}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>{item.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600 }}>
              <MapPin size={14} /> {item.location_found}
            </div>
          </div>

          <button style={{
            width: '100%', padding: '1.1rem', borderRadius: '18px', background: '#fff', color: '#0f172a',
            border: 'none', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}>
            View Details <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  };



  return (
    <div style={{
      background: '#FFFFFF',
      minHeight: '100vh',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.5s ease',
      color: '#0f172a'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .slide-in { animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <div style={{ padding: '0.75rem 1.75rem 4rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Campus Safety</span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Lost & <span style={{ color: '#f97316' }}>Found</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#0f172a';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(15,23,42,0.05)';
                  e.currentTarget.style.background = '#fff';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#f8fafc';
                }}
                style={{
                  width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: '16px',
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
                  fontSize: '0.9rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                }}
              />
            </div>
            <button
              onClick={() => setShowReportForm(true)}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '14px', background: '#0f172a', color: '#fff', border: 'none',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
              }}
            >
              <Plus size={18} /> Report Item
            </button>
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          <StatBadge icon={AlertCircle} label="Lost Items" value={stats.lost} color="#f43f5e" />
          <StatBadge icon={CheckCircle} label="Found Items" value={stats.found} color="#10b981" />
          <StatBadge icon={Package} label="Total Posts" value={stats.total} color="#3b82f6" />
          <StatBadge icon={ShieldCheck} label="Claimed" value={stats.claimed} color="#d946ef" />
        </div>

        {success && (
          <div className="fade-in" style={{ padding: '1rem 1.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '16px', color: '#059669', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
            <CheckCircle2 size={20} /> {success}
          </div>
        )}

        {/* ── Main View ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '2.5rem' }}>

          {/* Sidebar Filters */}
          <div style={{ width: '240px', flexShrink: 0 }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>View Type</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'feed', label: 'Community Feed', icon: Rss },
                  { id: 'my_posts', label: 'My Reports', icon: ClipboardList }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none',
                      background: tab === item.id ? '#0f172a' : 'transparent',
                      color: tab === item.id ? '#fff' : '#64748b',
                      fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                  >
                    <item.icon size={18} /> {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Categories</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {CATEGORIES.map(cat => {
                  const isActive = category === cat;
                  const meta = CAT_META[cat] || CAT_META.Other;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.1rem', borderRadius: '16px', border: 'none',
                        background: isActive ? '#0f172a' : 'transparent',
                        color: isActive ? '#fff' : '#64748b',
                        fontSize: '0.85rem', fontWeight: isActive ? 800 : 600, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isActive ? 'translateX(4px)' : 'none',
                        boxShadow: isActive ? '0 8px 20px rgba(15,23,42,0.15)' : 'none'
                      }}
                      onMouseOver={e => !isActive && (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {cat === 'All' ? <Filter size={18} /> : <meta.icon size={18} />}
                        {cat}
                      </div>
                      {isActive && <ChevronRight size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid Content */}
          <div style={{ flexGrow: 1 }}>
            {loading ? (
              <div style={{ padding: '6rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid #f1f5f9', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Refreshing Board...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '6rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <Search size={32} color="#cbd5e1" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>No items found</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>Try adjusting your filters or check back later.</p>
                <button
                  onClick={() => { setCategory('All'); setSearch(''); }}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', color: '#0f172a' }}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '2rem',
                paddingBottom: '3rem'
              }}>
                {filtered.map((item, i) => (
                  <div key={item.id} className="slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <ItemCard item={item} />
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Report Modal ────────────────────────────────────────── */}
      {showReportForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="fade-in" style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '28px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button
              onClick={() => setShowReportForm(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '36px', height: '36px', borderRadius: '12px', border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <Plus size={18} color="#f97316" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Report</span>
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Help the <span style={{ color: '#f97316' }}>Community</span></h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {['lost', 'found'].map(type => (
                  <label key={type} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem', borderRadius: '16px', border: '2px solid',
                    borderColor: form.item_type === type ? (type === 'lost' ? '#f43f5e' : '#10b981') : '#f1f5f9',
                    background: form.item_type === type ? (type === 'lost' ? '#fff1f2' : '#f0fdf4') : '#f8fafc',
                    fontWeight: 800, color: form.item_type === type ? (type === 'lost' ? '#f43f5e' : '#10b981') : '#64748b',
                    fontSize: '0.85rem', transition: 'all 0.2s'
                  }}>
                    <input type="radio" name="item_type" value={type} checked={form.item_type === type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))} style={{ display: 'none' }} />
                    {type === 'lost' ? '😟 Lost Something' : '🙌 Found Something'}
                  </label>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Item Title</label>
                  <input required placeholder="e.g. Blue Backpack" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#0f172a', fontWeight: 700, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, outline: 'none' }}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Location & Description</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input placeholder="e.g. Block C Cafeteria" value={form.location_found} onChange={e => setForm(f => ({ ...f, location_found: e.target.value }))}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, outline: 'none' }} />
                  <textarea placeholder="Describe features, colors, brand..." rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, outline: 'none', resize: 'none' }} />
                </div>
              </div>


              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Photo</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {form.image_url ? (
                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <img src={`${BASE_URL}/${form.image_url.replace(/^\//, '')}`} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      width: '100%', padding: '2rem', borderRadius: '16px', border: '2px dashed #e2e8f0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s'
                    }}>
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      <Camera size={32} color="#94a3b8" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                        {uploading ? 'Uploading...' : 'Click to upload a photo'}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" disabled={uploading} style={{ marginTop: '1rem', padding: '1rem', borderRadius: '16px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15,23,42,0.2)', opacity: uploading ? 0.5 : 1 }}>
                Submit Report
              </button>

            </form>
          </div>
        </div>
      )}
      {/* ── Details Modal ────────────────────────────────────────── */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="fade-in" style={{ background: '#fff', width: '100%', maxWidth: '800px', borderRadius: '32px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.2fr 1fr', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => setSelectedItem(null)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.9)', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <X size={24} />
            </button>

            <div style={{ height: '500px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f1f5f9' }}>
              {selectedItem.image_url ? (
                <img src={`${BASE_URL}/${selectedItem.image_url.replace(/^\//, '')}`} alt={selectedItem.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (

                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                  <Package size={80} />
                </div>
              )}
            </div>

            <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: '#f8fafc', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #eef2f6' }}>
                    {selectedItem.category}
                  </div>
                  <div style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: selectedItem.item_type === 'lost' ? '#fef2f2' : '#ecfdf5', color: selectedItem.item_type === 'lost' ? '#f43f5e' : '#10b981', fontSize: '0.7rem', fontWeight: 800 }}>
                    {selectedItem.item_type.toUpperCase()}
                  </div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem', lineHeight: 1.2 }}>{selectedItem.title}</h2>
                <p style={{ fontSize: '1rem', color: '#64748b', margin: 0, lineHeight: 1.7 }}>{selectedItem.description}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>
                  <MapPin size={18} color="#f97316" /> {selectedItem.location_found || 'Campus Location'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                  <Clock size={18} color="#94a3b8" /> Reported {new Date(selectedItem.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                  <User size={18} color="#94a3b8" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{selectedItem.posted_by_name}</span>
                    <span style={{ fontSize: '0.75rem' }}>Roll No: {selectedItem.posted_by_roll || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {selectedItem.status === 'open' && (
                <button
                  onClick={() => { handleClaim(selectedItem.id); setSelectedItem(null); }}
                  style={{
                    marginTop: 'auto', width: '100%', padding: '1.25rem', borderRadius: '20px', background: '#0f172a',
                    color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.3s'
                  }}
                >
                  Confirm Claim & Contact →
                </button>
              )}

              {selectedItem.status === 'claimed' && (
                <div style={{ marginTop: 'auto', padding: '1.25rem', borderRadius: '20px', background: '#ecfdf5', color: '#059669', textAlign: 'center', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={20} /> This item has been claimed
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default LostFound;

