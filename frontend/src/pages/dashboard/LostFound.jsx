import React, { useEffect, useState } from 'react';
import { Search, Plus, MapPin, Phone, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = ['All', 'Electronics', 'Documents', 'Personal', 'Bags', 'Keys', 'Other'];
const ITEM_COLORS = {
  Electronics: { bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9' },
  Documents:   { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  Personal:    { bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
  Bags:        { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
  Keys:        { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  Other:       { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
};

const LostFound = () => {
  const [feed, setFeed] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [tab, setTab] = useState('feed');          // 'feed' | 'my_posts' | 'report'
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);

  // Form state
  const [form, setForm] = useState({
    item_type: 'lost',
    title: '',
    description: '',
    category: 'Electronics',
    location_found: '',
    contact_info: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedRes, myRes] = await Promise.all([
        api.get('/lost-found/'),
        api.get('/lost-found/my-posts'),
      ]);
      setFeed(feedRes.data);
      setMyPosts(myRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClaim = async (id) => {
    await api.put(`/lost-found/${id}/claim`);
    setSuccess('Item marked as claimed!');
    setTimeout(() => setSuccess(null), 3000);
    fetchData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/lost-found/report', form);
    setSuccess('Report submitted! Awaiting admin approval.');
    setTimeout(() => setSuccess(null), 4000);
    setTab('my_posts');
    setForm({ item_type: 'lost', title: '', description: '', category: 'Electronics', location_found: '', contact_info: '' });
    fetchData();
  };

  const filtered = (tab === 'feed' ? feed : myPosts).filter(item => {
    const matchCat = category === 'All' || item.category === category;
    const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const ItemCard = ({ item }) => {
    const style = ITEM_COLORS[item.category] || ITEM_COLORS.Other;
    const isLost = item.item_type === 'lost';
    return (
      <div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: isLost ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)', color: isLost ? '#f43f5e' : '#10b981', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                {item.item_type}
              </span>
              <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: style.bg, color: style.color, fontSize: '0.7rem', fontWeight: 700 }}>
                {item.category}
              </span>
            </div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{item.title}</div>
          </div>
          {item.status === 'open' && tab === 'feed' && (
            <button onClick={() => handleClaim(item.id)} style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Mark Claimed
            </button>
          )}
        </div>
        {item.description && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>{item.description}</p>}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
          {item.location_found && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12} />{item.location_found}</span>}
          {item.contact_info && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={12} />{item.contact_info}</span>}
          {item.created_at && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} />{new Date(item.created_at).toLocaleDateString()}</span>}
        </div>
        {tab === 'my_posts' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: item.admin_approved === 'approved' ? 'rgba(16,185,129,0.15)' : item.admin_approved === 'rejected' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)', color: item.admin_approved === 'approved' ? '#10b981' : item.admin_approved === 'rejected' ? '#f43f5e' : '#f59e0b', fontWeight: 700 }}>
              Admin: {item.admin_approved}
            </span>
            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700 }}>
              {item.status}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🔍 Lost & Found</h1>
        <p>Community board for lost and found items on campus.</p>
      </div>

      {success && (
        <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#10b981', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        {[['feed', '📋 Community Feed'], ['my_posts', '📌 My Posts'], ['report', '➕ Report Item']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', border: '1px solid', borderColor: tab === key ? 'var(--color-accent-primary)' : 'var(--color-border)', background: tab === key ? 'var(--color-accent-primary)' : 'transparent', color: tab === key ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'report' ? (
        /* ── Report Form ── */
        <div className="bento-card glass-panel" style={{ maxWidth: 600, padding: '2rem' }}>
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Report a Lost or Found Item</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['lost', 'found'].map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid', borderColor: form.item_type === type ? (type === 'lost' ? '#f43f5e' : '#10b981') : 'var(--color-border)', background: form.item_type === type ? (type === 'lost' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)') : 'transparent', flex: 1, fontWeight: 700, color: form.item_type === type ? (type === 'lost' ? '#f43f5e' : '#10b981') : 'var(--color-text-secondary)' }}>
                  <input type="radio" name="item_type" value={type} checked={form.item_type === type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))} style={{ display: 'none' }} />
                  {type === 'lost' ? '😟 I Lost Something' : '🙌 I Found Something'}
                </label>
              ))}
            </div>
            <input required placeholder="Item title (e.g. Blue Backpack)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ borderRadius: 'var(--radius-md)' }} />
            <textarea placeholder="Description (color, brand, details...)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: '#fff', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: '#fff' }}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Location (e.g. Block C Cafeteria, Room 204)" value={form.location_found} onChange={e => setForm(f => ({ ...f, location_found: e.target.value }))} style={{ borderRadius: 'var(--radius-md)' }} />
            <input placeholder="Contact info (email or phone)" value={form.contact_info} onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))} style={{ borderRadius: 'var(--radius-md)' }} />
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Submit Report</button>
          </form>
        </div>
      ) : (
        /* ── Feed / My Posts ── */
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '2.5rem', borderRadius: 'var(--radius-full)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)', border: '1px solid', borderColor: category === c ? 'var(--color-accent-primary)' : 'var(--color-border)', background: category === c ? 'var(--color-accent-primary)' : 'transparent', color: category === c ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '3rem' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '3rem' }}>
              {tab === 'my_posts' ? "You haven't posted anything yet. Use 'Report Item' to post!" : "No items in the community feed yet."}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filtered.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LostFound;
