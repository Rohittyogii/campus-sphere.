import React, { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const MODULES = [
  { id: 'overview', name: 'Overview' },
  { id: 'recommendations', name: 'Personalized Picks' },
  { id: 'events', name: 'Events & Hackathons' },
  { id: 'community', name: 'Community Wall' },
  { id: 'clubs', name: 'Clubs & Societies' },
  { id: 'library', name: 'Library' },
  { id: 'cafe', name: 'Café' },
  { id: 'timetable', name: 'Timetable' },
  { id: 'lost_found', name: 'Lost & Found' },
  { id: 'open_electives', name: 'Open Electives' },
  { id: 'iro', name: 'IRO Portal' },
  { id: 'general', name: 'General Platform' }
];

const Feedback = () => {
  const [module, setModule] = useState('general');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await api.post('/feedback/', {
        module,
        rating,
        comment
      });
      setStatus('success');
      setComment('');
      setRating(5);
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page fade-in">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
            color: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
          }}>
            <MessageSquare size={32} />
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Your Voice Matters
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>
            Help us improve Campus Sphere. Your feedback goes directly to the admin team.
          </p>
        </div>

        <div className="card" style={{ padding: '2.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Module Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Which module are you reviewing?
              </label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#1e293b',
                    appearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  {MODULES.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                How would you rate your experience?
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star 
                      size={42} 
                      fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'} 
                      color={(hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1'}
                      style={{ transition: 'all 0.2s' }}
                    />
                  </button>
                ))}
                <span style={{ marginLeft: '1rem', fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', width: '3ch' }}>
                  {rating}/5
                </span>
              </div>
            </div>

            {/* Comment Block */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Detailed Feedback
              </label>
              <textarea
                placeholder="Tell us what you liked or what could be better..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                style={{
                  width: '100%',
                  minHeight: '160px',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '1rem',
                  fontWeight: 400,
                  color: '#1e293b',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Status Messages */}
            {status === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#047857', fontWeight: 600 }}>
                <CheckCircle2 size={20} />
                Feedback submitted successfully! Thank you.
              </div>
            )}
            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontWeight: 600 }}>
                <AlertCircle size={20} />
                Failed to submit feedback. Please try again.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '1.25rem',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)',
                transition: 'all 0.3s'
              }}
            >
              {loading ? (
                <div className="spinner-sm" style={{ width: '20px', height: '20px', borderTopColor: '#fff' }} />
              ) : (
                <>
                  <Send size={20} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
