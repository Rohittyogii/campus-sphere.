import React, { useEffect, useState } from 'react';
import { Coffee, Search, Tag } from 'lucide-react';
import api from '../../services/api';

const categoryColors = {
  'Beverages': { bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' },
  'Snacks': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Meals': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  'Desserts': { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' },
};

const Cafe = () => {
  const [menu, setMenu] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cafe/menu').then(res => {
      setMenu(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(menu.map(item => item.category).filter(Boolean))];

  const filtered = menu.filter(item => {
    const matchSearch = item.item_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🍴 Campus Cafe</h1>
        <p>Browse the full menu — {menu.length} items available today.</p>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.75rem', borderRadius: 'var(--radius-full)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--color-accent-primary)' : 'var(--color-border)',
                background: selectedCategory === cat ? 'var(--color-accent-primary)' : 'transparent',
                color: selectedCategory === cat ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '3rem' }}>Loading menu...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {filtered.map(item => {
            const style = categoryColors[item.category] || { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' };
            const isAvailable = item.availability_status?.toLowerCase() === 'available';
            return (
              <div key={item.itemid} className="bento-card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coffee size={20} color={style.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{item.item_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>#{item.itemid}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: style.color }}>
                  ₹{item.price}
                </div>

                {/* Footer badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: style.bg, color: style.color, fontSize: '0.75rem', fontWeight: 600 }}>
                    <Tag size={10} style={{ marginRight: 4 }} />{item.category}
                  </span>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    color: isAvailable ? '#10b981' : '#f43f5e',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {isAvailable ? '● Available' : '● Unavailable'}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-secondary)', padding: '3rem' }}>
              No items found for "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cafe;
