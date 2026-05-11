import React, { useEffect, useState, useMemo } from 'react';
import { Coffee, Search, Sparkles, UtensilsCrossed, ShoppingBag, ChevronRight, CheckCircle2, Clock, Info, ArrowRight, Heart } from 'lucide-react';

import api from '../../services/api';

const getCafeImage = (itemId) => {
  return `/cafe/${itemId}.jpg`;
};

// ── Helpers ────────────────────────────────────────────────────────
const categoryMeta = {
  'Beverages': { bg: '#e0f2fe', color: '#0284c7', icon: Coffee },
  'Snacks': { bg: '#ffedd5', color: '#ea580c', icon: UtensilsCrossed },
  'Meals': { bg: '#dcfce7', color: '#16a34a', icon: ShoppingBag },
  'Desserts': { bg: '#fce7f3', color: '#db2777', icon: Sparkles },
};

const getMeta = (cat) => categoryMeta[cat] || { bg: '#f1f5f9', color: '#475569', icon: UtensilsCrossed };

// ── Components ─────────────────────────────────────────────────────
const SleekCard = ({ children, style, accentColor = '#6366f1', image, badge, available = true }) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        height: '100%',
        overflow: 'hidden',
        ...style
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = `${accentColor}44`;
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = `0 12px 30px ${accentColor}10`;
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = '#f1f5f9';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
      }}
    >
      <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden', background: '#f8fafc' }}>
        {image ? (
          <img
            src={image}
            alt="Item"
            style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                transition: 'transform 0.5s',
                filter: available ? 'none' : 'grayscale(1) opacity(0.6)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ 
            height: '100%', 
            width: '100%', 
            background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            opacity: 0.3
          }}>
            <UtensilsCrossed size={48} />
          </div>
        )}
        
        {badge && (
          <div style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            background: 'rgba(255,255,255,0.9)', 
            backdropFilter: 'blur(8px)', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '99px', 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            color: accentColor,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {badge}
          </div>
        )}

        {!available && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(255,255,255,0.4)', 
            backdropFilter: 'blur(2px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <div style={{ background: '#ef4444', color: '#fff', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
              OUT OF STOCK
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
        {children}
      </div>
    </div>
  );
};

const Cafe = () => {
  const [menu, setMenu] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [topPicks, setTopPicks] = useState([]);
  const [combos, setCombos] = useState([]);
  const [trending, setTrending] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const [mounted, setMounted] = useState(false);



  // Meal Builder State
  const [meal1, setMeal1] = useState('');
  const [meal2, setMeal2] = useState('');
  const [meal3, setMeal3] = useState('');
  const [mealResult, setMealResult] = useState(null);

  const [showToast, setShowToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);



  useEffect(() => {
    api.get('/cafe/menu').then(res => {
      setMenu(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.get('/recommendations/all').then(res => {
      setTopPicks(res.data?.cafe?.top_picks || []);
      setCombos(res.data?.cafe?.combos || []);
      setTrending(res.data?.cafe?.trending || []);
    }).catch(() => {});

    api.get('/cafe/favorites').then(res => {
        setUserFavorites((res.data || []).map(f => f.item_name));
    }).catch(() => {});




    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleFavorite = async (itemName) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/cafe/favorite?item_name=${encodeURIComponent(itemName)}`);
      const isAdded = res.data.status === 'added';
      
      setShowToast({ 
        message: isAdded ? `"${itemName}" saved to your favorites!` : `"${itemName}" removed from favorites.`, 
        type: 'success' 
      });

      if (isAdded) {
        setUserFavorites(prev => [...prev, itemName]);
      } else {
        setUserFavorites(prev => prev.filter(f => f !== itemName));
      }

      // Refresh recommendations to reflect the new favorite set
      api.get('/recommendations/all').then(res => {
        setTopPicks(res.data?.cafe?.top_picks || []);
      }).catch(() => {});
    } catch (err) {
      setShowToast({ message: "Failed to update favorites.", type: 'error' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setShowToast(null), 3000);
    }
  };



  const categories = ['All', ...new Set(menu.map(i => i.category).filter(Boolean))];

  const filtered = useMemo(() => {
    return menu.filter(item => {
      const matchSearch = item.item_name?.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [menu, search, selectedCategory]);

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
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Campus Dining</span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              The <span style={{ color: '#f97316' }}>Cafe</span> Hub
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {userFavorites.map((fav, i) => (
                <div key={i} className="fade-in" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: '#fff1f2', 
                    padding: '0.4rem 0.9rem', 
                    borderRadius: '12px', 
                    border: '1px solid #fecdd3',
                    animationDelay: `${i * 0.05}s`
                }}>
                    <Heart size={12} color="#e11d48" fill="#e11d48" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{fav}</span>
                </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>


            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Craving something specific?"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '14px',
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
                  fontSize: '0.85rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Meal Builder ─────────────────────────────────────────── */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          borderRadius: '24px', 
          padding: '2.5rem', 
          marginBottom: '4rem',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Background Decoration */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: '#f97316', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15 }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <UtensilsCrossed size={18} color="#f97316" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Custom Bundle</span>
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem', lineHeight: 1.1 }}>Build Your <span style={{ color: '#f97316' }}>Perfect</span> Meal</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>Select any three items from our menu to create your own personalized meal deal. Get exactly what you crave, bundled and ready.</p>
            </div>

            {mealResult && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f97316' }}>YOUR BUNDLE TOTAL</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>₹{mealResult.total}</div>
                <button 
                  onClick={() => setMealResult(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Reset Meal
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexGrow: 1, gap: '1rem' }}>
              {[1, 2, 3].map(num => (
                <div key={num} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Choice {num}</label>
                  <select 
                    value={num === 1 ? meal1 : num === 2 ? meal2 : meal3}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (num === 1) setMeal1(val);
                      if (num === 2) setMeal2(val);
                      if (num === 3) setMeal3(val);
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '0.85rem 1rem', 
                      borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      color: '#fff', 
                      fontSize: '0.85rem', 
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ color: '#000' }}>Select an item...</option>
                    {menu.map(item => (
                      <option key={item.itemid} value={item.itemid} style={{ color: '#000' }}>{item.item_name} - ₹{item.price}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => {
                const selected = [meal1, meal2, meal3].filter(id => id !== '');
                const items = selected.map(id => menu.find(i => i.itemid === id)).filter(Boolean);
                
                if (items.length >= 2) {
                  setMealResult({
                    items: items,
                    total: items.reduce((acc, curr) => acc + curr.price, 0).toFixed(2)
                  });
                }
              }}
              disabled={[meal1, meal2, meal3].filter(id => id !== '').length < 2}
              style={{ 
                padding: '0.85rem 2rem', 
                borderRadius: '12px', 
                background: ([meal1, meal2, meal3].filter(id => id !== '').length < 2) ? '#334155' : '#f97316', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 800, 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <UtensilsCrossed size={16} /> Make it a Meal
            </button>
          </div>

          {mealResult && (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: `repeat(${mealResult.items.length}, 1fr)`, gap: '1.5rem', marginTop: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>

              {mealResult.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>
                    <img src={getCafeImage(item.itemid)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.item_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>₹{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* ── Smart Recommendations ────────────────────────────────── */}
        {topPicks.length > 0 && search === '' && (
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={20} color="#f97316" />
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recommended for You</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {topPicks.map((item, i) => {
                const meta = getMeta(item.category);
                return (
                  <SleekCard 
                    key={i} 
                    accentColor="#f97316" 
                    image={getCafeImage(item.itemid)} 
                    badge="AI PICK"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    className="slide-in"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                        <meta.icon size={18} />
                      </div>
                      <div style={{ padding: '0.3rem 0.6rem', background: '#fff7ed', color: '#c2410c', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800 }}>
                        {item.category}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>{item.item_name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>₹{item.price}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFavorite(item.item_name)}
                      disabled={actionLoading}
                      style={{ 
                        marginTop: 'auto', 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: '12px', 
                        background: '#0f172a', 
                        color: '#fff', 
                        border: 'none', 
                        fontWeight: 700, 
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        opacity: actionLoading ? 0.7 : 1
                    }}
                    onMouseOver={e => { if (!actionLoading) e.currentTarget.style.background = '#ef4444'; }}
                    onMouseOut={e => { if (!actionLoading) e.currentTarget.style.background = '#0f172a'; }}
                    >
                      <Heart 
                        size={14} 
                        fill={userFavorites.includes(item.item_name) ? '#ef4444' : 'none'} 
                        color={userFavorites.includes(item.item_name) ? '#ef4444' : 'currentColor'} 
                      /> 
                      {userFavorites.includes(item.item_name) ? 'Favorited' : 'Add to Favourite'}
                    </button>



                  </SleekCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Trending Now ────────────────────────────────────────── */}
        {trending.length > 0 && search === '' && (
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={20} color="#6366f1" />
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Trending Now</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {trending.map((item, i) => {
                const meta = getMeta(item.category);
                return (
                  <div key={i} style={{
                    background: '#fff',
                    borderRadius: '20px',
                    border: '1px solid #f1f5f9',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    animationDelay: `${i * 0.05}s`
                  }}
                  className="fade-in"
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  }}
                  >
                    <div style={{ 
                        height: '100px', 
                        borderRadius: '14px', 
                        overflow: 'hidden', 
                        background: '#f8fafc',
                        position: 'relative'
                    }}>
                        <img src={getCafeImage(item.itemid)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.2rem 0.5rem', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800, color: '#6366f1' }}>
                            #TRENDING
                        </div>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item_name}</h4>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{item.category}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>₹{item.price}</span>
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: `${meta.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                            <meta.icon size={12} />
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Main Explorer ────────────────────────────────────────── */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Full Menu</h2>
              <div style={{ padding: '0.3rem 0.8rem', background: '#f1f5f9', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                {filtered.length} Items
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', maxWidth: '100%' }}>
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: isActive ? '#f97316' : '#e2e8f0',
                      background: isActive ? '#f97316' : '#fff',
                      color: isActive ? '#fff' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} style={{ height: '320px', borderRadius: '24px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((item, i) => {
                const meta = getMeta(item.category);
                const isAvailable = item.availability_status?.toLowerCase() === 'available';
                return (
                  <SleekCard 
                    key={item.itemid || i} 
                    accentColor={meta.color} 
                    image={getCafeImage(item.itemid)}
                    available={isAvailable}
                    className="fade-in"
                    style={{ animationDelay: `${(i % 12) * 0.05}s` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                        <meta.icon size={16} />
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isAvailable ? '#10b981' : '#ef4444' }}>
                        {isAvailable ? 'AVAILABLE' : 'SOLD OUT'}
                      </span>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>{item.item_name}</h3>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>{item.category}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>₹{item.price}</span>
                      <button 
                        disabled={!isAvailable || actionLoading}
                        onClick={() => handleFavorite(item.item_name)}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '12px', 
                          background: isAvailable ? '#0f172a' : '#f1f5f9', 
                          color: isAvailable ? '#fff' : '#cbd5e1', 
                          border: 'none', 
                          cursor: (isAvailable && !actionLoading) ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          opacity: actionLoading ? 0.7 : 1
                        }}
                        onMouseOver={e => { if (isAvailable && !actionLoading) e.currentTarget.style.background = '#ef4444'; }}
                        onMouseOut={e => { if (isAvailable && !actionLoading) e.currentTarget.style.background = '#0f172a'; }}
                      >
                        <Heart 
                            size={18} 
                            fill={userFavorites.includes(item.item_name) ? '#ef4444' : 'none'} 
                            color={userFavorites.includes(item.item_name) ? '#ef4444' : 'currentColor'} 
                        />
                      </button>



                    </div>
                  </SleekCard>
                );
              })}
            </div>
          )}

          {filtered.length === 0 && !loading && (
             <div style={{ textAlign: 'center', padding: '6rem 0' }}>
               <UtensilsCrossed size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
               <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#64748b' }}>No items found matching your search.</h3>
               <p style={{ color: '#94a3b8' }}>Try a different craving!</p>
             </div>
          )}
        </div>
      </div>

      {/* ── Toast Notification ──────────────────────────────────── */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: showToast.type === 'success' ? '#0f172a' : '#ef4444',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {showToast.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <Info size={18} />}
          {showToast.message}
        </div>
      )}
    </div>

  );
};

export default Cafe;
