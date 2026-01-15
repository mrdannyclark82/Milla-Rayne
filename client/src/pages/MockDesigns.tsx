import { useState } from 'react';
import { MessageCircle, Send, Mic, Settings, BookOpen, Youtube, Sparkles, Palette, Brain, Volume2, Menu, X } from 'lucide-react';

export default function MockDesigns() {
  return <CombinedDesign />;
}

function CombinedDesign() {
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { icon: MessageCircle, label: 'Chat', active: true },
    { icon: Brain, label: 'Memory', active: false },
    { icon: BookOpen, label: 'Knowledge', active: false },
    { icon: Youtube, label: 'Media', active: false },
    { icon: Palette, label: 'Create', active: false },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      height: '100vh',
      background: '#000000', 
      position: 'relative',
      overflow: 'hidden'
    }}>
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

      <div style={{ position: 'relative', display: 'flex', height: '100%' }}>
        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="desktop-sidebar" style={{ 
          width: '4.5rem', 
          background: 'rgba(0, 0, 0, 0.5)', 
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '1.5rem 0', 
          gap: '1.5rem',
          flexShrink: 0
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
            {navItems.map((item, index) => (
              <button key={index} style={{ 
                width: '2.75rem', 
                height: '2.75rem', 
                borderRadius: '0.75rem', 
                background: item.active ? 'rgba(34, 211, 238, 0.15)' : 'transparent', 
                border: item.active ? '1px solid rgba(34, 211, 238, 0.3)' : 'none',
                color: item.active ? '#22d3ee' : '#6b7280', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <item.icon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            ))}
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
            cursor: 'pointer'
          }}>
            <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Mobile Header */}
          <header className="mobile-header" style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '2rem', 
                height: '2rem', 
                borderRadius: '0.5rem', 
                background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
              }}>
                <Sparkles style={{ width: '1rem', height: '1rem', color: 'white' }} />
              </div>
              <span style={{ color: '#22d3ee', fontWeight: 600, fontSize: '1.125rem' }}>MILLA.AI</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#9ca3af',
                padding: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </header>

          {/* Chat Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
              {/* AI Message */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)'
                }} />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.25rem', 
                  padding: '0.875rem 1rem', 
                  maxWidth: 'calc(100% - 3rem)', 
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
                  <p style={{ color: '#e5e7eb', lineHeight: 1.5, margin: 0, fontSize: '0.9375rem' }}>
                    <span style={{ color: '#22d3ee' }}>[MILLA.AI]</span> Systems online. Neural pathways synchronized. Ready to assist with any task — from complex analysis to creative exploration. What would you like to explore today?
                  </p>
                </div>
              </div>

              {/* User Message */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <div style={{ 
                  background: 'linear-gradient(to right, rgba(139, 92, 246, 0.8), rgba(192, 38, 211, 0.8))', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopRightRadius: '0.25rem', 
                  padding: '0.875rem 1rem', 
                  maxWidth: 'calc(100% - 3rem)', 
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
                  <p style={{ color: 'white', lineHeight: 1.5, margin: 0, fontSize: '0.9375rem' }}>
                    I want to analyze some code patterns and get your thoughts on architecture
                  </p>
                </div>
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  borderRadius: '50%', 
                  background: '#1f2937', 
                  flexShrink: 0,
                  border: '1px solid #374151'
                }} />
              </div>

              {/* AI Response */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)'
                }} />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.25rem', 
                  padding: '0.875rem 1rem', 
                  maxWidth: 'calc(100% - 3rem)', 
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
                  <p style={{ color: '#e5e7eb', lineHeight: 1.5, margin: 0, fontSize: '0.9375rem' }}>
                    <span style={{ color: '#22d3ee' }}>[MILLA.AI]</span> Excellent choice. I can help analyze patterns, suggest optimizations, and discuss architectural trade-offs. Share your code or describe the architecture you're working with, and I'll provide detailed insights.
                  </p>
                  <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      padding: '0.1875rem 0.5rem', 
                      fontSize: '0.6875rem', 
                      borderRadius: '0.25rem', 
                      background: 'rgba(34, 211, 238, 0.2)', 
                      color: '#22d3ee', 
                      border: '1px solid rgba(34, 211, 238, 0.3)' 
                    }}>Code Analysis</span>
                    <span style={{ 
                      padding: '0.1875rem 0.5rem', 
                      fontSize: '0.6875rem', 
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

          {/* Input Area */}
          <div style={{ 
            padding: '0.75rem 1rem', 
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(0, 0, 0, 0.3)', 
            backdropFilter: 'blur(20px)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(20px)', 
                borderRadius: '0.75rem', 
                padding: '0.5rem 0.75rem', 
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
                    fontSize: '0.9375rem',
                    position: 'relative',
                    zIndex: 10,
                    minWidth: 0
                  }}
                />
                <button style={{ 
                  width: '2.25rem', 
                  height: '2.25rem', 
                  borderRadius: '0.5rem', 
                  background: 'transparent', 
                  color: '#9ca3af', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10,
                  flexShrink: 0
                }}>
                  <Mic style={{ width: '1.125rem', height: '1.125rem' }} />
                </button>
                <button style={{ 
                  width: '2.25rem', 
                  height: '2.25rem', 
                  borderRadius: '0.5rem', 
                  background: 'linear-gradient(to right, #8b5cf6, #22d3ee)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)',
                  flexShrink: 0
                }}>
                  <Send style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
              <div className="command-chips" style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.625rem', 
                  fontSize: '0.6875rem', 
                  borderRadius: '0.375rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: '#9ca3af', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>/analyze</span>
                <span style={{ 
                  padding: '0.25rem 0.625rem', 
                  fontSize: '0.6875rem', 
                  borderRadius: '0.375rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: '#9ca3af', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>/create</span>
                <span style={{ 
                  padding: '0.25rem 0.625rem', 
                  fontSize: '0.6875rem', 
                  borderRadius: '0.375rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: '#9ca3af', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>/remember</span>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="mobile-nav" style={{
            display: 'none',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0.5rem 0.5rem',
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {navItems.map((item, index) => (
              <button key={index} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.25rem',
                background: 'transparent',
                border: 'none',
                color: item.active ? '#22d3ee' : '#6b7280',
                cursor: 'pointer',
                padding: '0.375rem 0.75rem'
              }}>
                <item.icon style={{ width: '1.25rem', height: '1.25rem' }} />
                <span style={{ fontSize: '0.625rem', fontWeight: 500 }}>{item.label}</span>
              </button>
            ))}
            <button style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '0.25rem',
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '0.375rem 0.75rem'
            }}>
              <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
              <span style={{ fontSize: '0.625rem', fontWeight: 500 }}>Settings</span>
            </button>
          </nav>
        </main>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-header {
            display: flex !important;
          }
          .mobile-nav {
            display: flex !important;
          }
          .command-chips {
            margin-bottom: 0.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
