import { useState } from 'react';
import { MessageCircle, Send, Mic, Settings, BookOpen, Youtube, Sparkles, Palette, Brain, Volume2 } from 'lucide-react';

export default function MockDesigns() {
  return <CombinedDesign />;
}

function CombinedDesign() {
  const [message, setMessage] = useState('');

  return (
    <div style={{ minHeight: '100vh', background: '#000000', position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'radial-gradient(ellipse at top, rgba(120, 50, 255, 0.15), transparent 50%)' 
      }} />
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'radial-gradient(ellipse at bottom right, rgba(0, 200, 255, 0.1), transparent 50%)' 
      }} />

      <div style={{ position: 'relative', display: 'flex', height: '100vh' }}>
        <aside style={{ 
          width: '4.5rem', 
          background: 'rgba(0, 0, 0, 0.5)', 
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '1.5rem 0', 
          gap: '1.5rem' 
        }}>
          <div style={{ 
            width: '2.75rem', 
            height: '2.75rem', 
            borderRadius: '0.75rem', 
            background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
          }}>
            <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <button style={{ 
              width: '2.75rem', 
              height: '2.75rem', 
              borderRadius: '0.75rem', 
              background: 'rgba(34, 211, 238, 0.15)', 
              border: '1px solid rgba(34, 211, 238, 0.3)',
              color: '#22d3ee', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <MessageCircle style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button style={{ 
              width: '2.75rem', 
              height: '2.75rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              border: 'none',
              color: '#6b7280', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <Brain style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button style={{ 
              width: '2.75rem', 
              height: '2.75rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              border: 'none',
              color: '#6b7280', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <BookOpen style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button style={{ 
              width: '2.75rem', 
              height: '2.75rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              border: 'none',
              color: '#6b7280', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <Youtube style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button style={{ 
              width: '2.75rem', 
              height: '2.75rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              border: 'none',
              color: '#6b7280', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <Palette style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </nav>

          <div style={{ 
            padding: '0.5rem', 
            borderRadius: '0.75rem', 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1))', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '0.5rem'
          }}>
            <Volume2 style={{ width: '1rem', height: '1rem', color: '#a78bfa' }} />
          </div>

          <button style={{ 
            width: '2.75rem', 
            height: '2.75rem', 
            borderRadius: '0.75rem', 
            background: 'transparent', 
            border: 'none',
            color: '#6b7280', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
                  flexShrink: 0,
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
                }} />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.25rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: '1px', 
                    background: 'linear-gradient(to right, transparent, rgba(34, 211, 238, 0.5), transparent)' 
                  }} />
                  <p style={{ color: '#e5e7eb', lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: '#22d3ee' }}>[MILLA.AI]</span> Systems online. Neural pathways synchronized. Ready to assist with any task — from complex analysis to creative exploration. What would you like to explore today?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ 
                  background: 'linear-gradient(to right, rgba(139, 92, 246, 0.8), rgba(192, 38, 211, 0.8))', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopRightRadius: '0.25rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%', 
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: '1px', 
                    background: 'linear-gradient(to right, transparent, rgba(167, 139, 250, 0.5), transparent)' 
                  }} />
                  <p style={{ color: 'white', lineHeight: 1.6, margin: 0 }}>
                    I want to analyze some code patterns and get your thoughts on architecture
                  </p>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: '#1f2937', 
                  flexShrink: 0,
                  border: '1px solid #374151'
                }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
                  flexShrink: 0,
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
                }} />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.25rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: '1px', 
                    background: 'linear-gradient(to right, transparent, rgba(34, 211, 238, 0.5), transparent)' 
                  }} />
                  <p style={{ color: '#e5e7eb', lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: '#22d3ee' }}>[MILLA.AI]</span> Excellent choice. I can help analyze patterns, suggest optimizations, and discuss architectural trade-offs. Share your code or describe the architecture you're working with, and I'll provide detailed insights.
                  </p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      fontSize: '0.75rem', 
                      borderRadius: '0.25rem', 
                      background: 'rgba(34, 211, 238, 0.2)', 
                      color: '#22d3ee', 
                      border: '1px solid rgba(34, 211, 238, 0.3)' 
                    }}>Code Analysis</span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      fontSize: '0.75rem', 
                      borderRadius: '0.25rem', 
                      background: 'rgba(139, 92, 246, 0.2)', 
                      color: '#a78bfa', 
                      border: '1px solid rgba(139, 92, 246, 0.3)' 
                    }}>Architecture</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(0, 0, 0, 0.3)', 
            backdropFilter: 'blur(20px)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(20px)', 
                borderRadius: '1rem', 
                padding: '0.75rem 1rem', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), rgba(34, 211, 238, 0.05))' 
                }} />
                <input
                  type="text"
                  placeholder="Message Milla..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    color: 'white', 
                    border: 'none', 
                    outline: 'none',
                    fontSize: '1rem',
                    position: 'relative',
                    zIndex: 10
                  }}
                />
                <button style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '0.75rem', 
                  background: 'transparent', 
                  color: '#9ca3af', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <Mic style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                <button style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '0.75rem', 
                  background: 'linear-gradient(to right, #8b5cf6, #22d3ee)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
                }}>
                  <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <span style={{ 
                  padding: '0.375rem 0.75rem', 
                  fontSize: '0.75rem', 
                  borderRadius: '0.5rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: '#9ca3af', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}>/analyze</span>
                <span style={{ 
                  padding: '0.375rem 0.75rem', 
                  fontSize: '0.75rem', 
                  borderRadius: '0.5rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: '#9ca3af', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}>/create</span>
                <span style={{ 
                  padding: '0.375rem 0.75rem', 
                  fontSize: '0.75rem', 
                  borderRadius: '0.5rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: '#9ca3af', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}>/remember</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
