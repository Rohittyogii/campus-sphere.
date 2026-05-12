import React, { useEffect, useState } from 'react';
import { Heart, MessageSquare, Share2, Plus, Search, Image as ImageIcon, Send, User, Award, Flame, Filter, MoreHorizontal, Camera, X } from 'lucide-react';
import api from '../../services/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api/v1', '');

const CategoryBadge = ({ category }) => {

  const colors = {
    Achievement: { bg: '#ecfdf5', text: '#10b981', icon: Award },
    Question: { bg: '#eff6ff', text: '#3b82f6', icon: MessageSquare },
    Event: { bg: '#fdf4ff', text: '#d946ef', icon: Flame },
    General: { bg: '#f8fafc', text: '#64748b', icon: Filter }
  };
  const meta = colors[category] || colors.General;
  return (
    <div style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', background: meta.bg, color: meta.color, fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
      <meta.icon size={12} /> {category}
    </div>
  );
};

const PostCard = ({ post, onLike, onComment, currentUserId }) => {
  const isLiked = post.likes.includes(currentUserId);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '24px',
      border: '1px solid #eef2f6',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      transition: 'transform 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            {post.author.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{post.author.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{post.author.course} • {new Date(post.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <CategoryBadge category={post.category} />
      </div>

      <p style={{ fontSize: '1rem', color: '#1e293b', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
        {post.content}
      </p>

      {post.image_url && (
        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid #f1f5f9' }}>
          <img 
            src={post.image_url.startsWith('http') ? post.image_url : `${BASE_URL}/${post.image_url.replace(/^\//, '')}`} 
            alt="Post" 
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} 
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: showComments ? '1.5rem' : '0' }}>
        <button
          onClick={() => onLike(post.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#f43f5e' : '#64748b', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}
        >
          <Heart size={20} fill={isLiked ? '#f43f5e' : 'none'} /> {post.likes.length}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: showComments ? '#8b5cf6' : '#64748b', fontWeight: 700, fontSize: '0.85rem' }}
        >
          <MessageSquare size={20} /> {post.comments?.length || 0} Replies
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', marginLeft: 'auto' }}>
          <Share2 size={18} />
        </button>
      </div>

      {showComments && (
        <div className="fade-in" style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {post.comments?.map((comment, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                  {comment.author.name[0]}
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>{comment.author.name}</span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5 }}>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Write a reply..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', fontWeight: 600, outline: 'none', color: '#0f172a' }}
            />
            <button
              type="submit"
              style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const Community = ({ profile }) => {
  const [posts, setPosts] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [trends, setTrends] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ content: '', image_url: '', category: 'General' });

  const fetchData = async () => {
    try {
      const [postRes, lostRes, trendRes, userRes] = await Promise.all([
        api.get('/community/'),
        api.get('/lost-found/'),
        api.get('/community/trends'),
        api.get('/community/contributors')
      ]);
      setPosts(postRes.data);
      setLostItems(lostRes.data.filter(i => i.status === 'open' && i.item_type === 'lost').slice(0, 5));
      setTrends(trendRes.data);
      setTopUsers(userRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClaim = async (itemId) => {
    try {
      await api.put(`/lost-found/${itemId}/claim`);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleLike = async (postId) => {

    try {
      const res = await api.post(`/community/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: res.data.likes } : p));
    } catch (e) { console.error(e); }
  };

  const handleComment = async (postId, content) => {
    try {
      await api.post(`/community/${postId}/comment`, { content });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const [uploading, setUploading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/community/create', form);
      setForm({ content: '', image_url: '', category: 'General' });
      setShowCreate(false);
      fetchPosts();
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', padding: '0.75rem 1.75rem 4rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Campus Life</span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Community <span style={{ color: '#8b5cf6' }}>Wall</span>
            </h1>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '14px', background: '#0f172a', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
              boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
            }}
          >
            <Plus size={18} /> New Post
          </button>
        </div>

        {/* Lost & Found Highlights - Horizontal Scroll */}
        {lostItems.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Search size={18} color="#f43f5e" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lost on Campus</span>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9', marginLeft: '1rem' }} />
            </div>

            <div style={{
              display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem',
              scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}>
              {lostItems.map(item => (
                <div key={item.id} style={{
                  flex: '0 0 280px', background: '#fff', borderRadius: '20px', border: '1px solid #eef2f6', overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative'
                }}>
                  <div style={{ height: '120px', background: '#f8fafc', overflow: 'hidden' }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}/${item.image_url.replace(/^\//, '')}`} 
                        alt={item.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <Plus size={32} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>{item.location_found}</div>
                    <button
                      onClick={() => handleClaim(item.id)}
                      style={{
                        width: '100%', padding: '0.5rem', borderRadius: '10px', background: '#0f172a', color: '#fff',
                        border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                      }}
                    >
                      Mark as Claimed →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem' }}>


          {/* Main Feed */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Feed...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                <h3 style={{ fontWeight: 800, color: '#0f172a' }}>No posts yet</h3>
                <p style={{ color: '#64748b' }}>Be the first to share something with the campus!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} currentUserId={profile.id} />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '1rem' }}>
            <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '1.5rem', border: '1px solid #eef2f6', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Trending Topics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {trends.length > 0 ? trends.map(item => (
                  <div key={item.tag} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{item.tag}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.count}</div>
                  </div>
                )) : (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No active trends...</div>
                )}
              </div>
            </div>

            <div style={{ background: '#8b5cf608', borderRadius: '24px', padding: '1.5rem', border: '1px solid #8b5cf615' }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Top Contributors</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topUsers.length > 0 ? topUsers.map((user, i) => (
                  <div key={user.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fff', border: '1px solid #8b5cf633', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#8b5cf6' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{user.points} XP</div>
                    </div>
                    <Award size={16} color="#8b5cf6" />
                  </div>
                )) : (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Analyzing activity...</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '28px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button
              onClick={() => setShowCreate(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '36px', height: '36px', borderRadius: '12px', border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <Send size={18} color="#8b5cf6" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Post</span>
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Share with <span style={{ color: '#8b5cf6' }}>Campus</span></h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Category</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['General', 'Achievement', 'Question', 'Event'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid',
                        borderColor: form.category === cat ? '#8b5cf6' : '#e2e8f0',
                        background: form.category === cat ? '#f5f3ff' : '#fff',
                        color: form.category === cat ? '#8b5cf6' : '#64748b',
                        fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Content</label>
                <textarea
                  required
                  placeholder="What's happening?"
                  rows={4}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', color: '#0f172a', fontWeight: 600, outline: 'none', resize: 'none' }}
                />
              </div>


              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Photo</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {form.image_url ? (
                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <img 
                        src={form.image_url.startsWith('http') ? form.image_url : `${BASE_URL}/${form.image_url.replace(/^\//, '')}`} 
                        alt="Preview" 
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} 
                      />
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
                      <ImageIcon size={32} color="#94a3b8" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                        {uploading ? 'Uploading...' : 'Click to upload a photo'}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" disabled={uploading} style={{ marginTop: '1rem', padding: '1rem', borderRadius: '16px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15,23,42,0.2)', opacity: uploading ? 0.5 : 1 }}>
                Post to Wall
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default Community;
