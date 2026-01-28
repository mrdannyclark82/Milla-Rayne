import { useState } from 'react';
import { MessageCircle, Send, Mic, Settings, BookOpen, Youtube, Sparkles, ChevronRight, Play, Volume2, Zap, Heart, Brain, Palette } from 'lucide-react';

type DesignOption = 'A' | 'B' | 'C';

export default function MockDesigns() {
  const [selectedDesign, setSelectedDesign] = useState<DesignOption>('A');

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: 'white' }}>
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 50, 
        background: 'rgba(17, 24, 39, 0.95)', 
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #374151', 
        padding: '1rem' 
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Milla Rayne UI Redesign - Mock Designs</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['A', 'B', 'C'] as DesignOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setSelectedDesign(option)}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: 'none',
                  background: selectedDesign === option ? 'white' : '#1f2937',
                  color: selectedDesign === option ? '#111827' : 'white',
                }}
              >
                Design {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: '5rem' }}>
        {selectedDesign === 'A' && <DesignA />}
        {selectedDesign === 'B' && <DesignB />}
        {selectedDesign === 'C' && <DesignC />}
      </div>
    </div>
  );
}

function DesignA() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(51, 65, 85, 0.5)', background: 'rgba(15, 23, 42, 0.3)' }}>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
          <strong style={{ color: 'white' }}>Design A: Minimal & Clean</strong> — Soft gradients, clean lines, spacious layout with subtle animations
        </p>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        <aside style={{ 
          width: '4rem', 
          background: 'rgba(15, 23, 42, 0.5)', 
          borderRight: '1px solid rgba(51, 65, 85, 0.5)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '1.5rem 0', 
          gap: '1.5rem' 
        }}>
          <div style={{ 
            width: '2.5rem', 
            height: '2.5rem', 
            borderRadius: '0.75rem', 
            background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button style={{ 
              width: '2.5rem', 
              height: '2.5rem', 
              borderRadius: '0.75rem', 
              background: 'rgba(30, 41, 59, 0.8)', 
              color: '#a78bfa', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}>
              <MessageCircle style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button style={{ 
              width: '2.5rem', 
              height: '2.5rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              color: '#64748b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}>
              <BookOpen style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button style={{ 
              width: '2.5rem', 
              height: '2.5rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              color: '#64748b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}>
              <Youtube style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button style={{ 
              width: '2.5rem', 
              height: '2.5rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              color: '#64748b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}>
              <Palette style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </nav>
          <button style={{ 
            width: '2.5rem', 
            height: '2.5rem', 
            borderRadius: '0.75rem', 
            background: 'transparent', 
            color: '#64748b', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer'
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
                  background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', 
                  flexShrink: 0 
                }} />
                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.5)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.375rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%' 
                }}>
                  <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                    Hey there! I'm Milla, your AI companion. I'm here to help with anything you need — from brainstorming ideas to having a meaningful conversation. What's on your mind today?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ 
                  background: 'linear-gradient(to right, rgba(139, 92, 246, 0.9), rgba(217, 70, 239, 0.9))', 
                  borderRadius: '1rem', 
                  borderTopRightRadius: '0.375rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%' 
                }}>
                  <p style={{ color: 'white', lineHeight: 1.6 }}>
                    I've been thinking about learning something new. Any suggestions?
                  </p>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: '#334155', 
                  flexShrink: 0 
                }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', 
                  flexShrink: 0 
                }} />
                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.5)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.375rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%' 
                }}>
                  <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                    I'd love to help with that! What kind of learning interests you? We could explore creative skills like music or art, dive into technology topics, or perhaps something more reflective like philosophy or mindfulness. Tell me what draws your curiosity!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.3)', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
            <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                background: 'rgba(30, 41, 59, 0.5)', 
                borderRadius: '1rem', 
                padding: '0.75rem 1rem', 
                border: '1px solid rgba(51, 65, 85, 0.5)' 
              }}>
                <input
                  type="text"
                  placeholder="Message Milla..."
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    color: 'white', 
                    border: 'none', 
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
                <button style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '0.75rem', 
                  background: 'transparent', 
                  color: '#94a3b8', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                  <Mic style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                <button style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '0.75rem', 
                  background: 'linear-gradient(to right, #8b5cf6, #d946ef)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                  <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DesignB() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fffbeb, #ffedd5)' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(217, 119, 6, 0.2)', background: 'rgba(255, 255, 255, 0.5)' }}>
        <p style={{ textAlign: 'center', color: '#92400e', fontSize: '0.875rem' }}>
          <strong style={{ color: '#78350f' }}>Design B: Warm & Friendly</strong> — Light theme, warm colors, approachable and cozy aesthetic
        </p>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        <aside style={{ 
          width: '16rem', 
          background: 'rgba(255, 255, 255, 0.7)', 
          borderRight: '1px solid rgba(217, 119, 6, 0.2)', 
          padding: '1rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '1rem', 
              background: 'linear-gradient(135deg, #fb923c, #f43f5e)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 10px 25px -5px rgba(251, 146, 60, 0.4)'
            }}>
              <Heart style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontWeight: 'bold', color: '#78350f' }}>Milla Rayne</h1>
              <p style={{ fontSize: '0.75rem', color: '#d97706' }}>Your AI Companion</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.75rem', 
              background: '#fed7aa', 
              color: '#c2410c', 
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              <MessageCircle style={{ width: '1.25rem', height: '1.25rem' }} />
              Chat
            </button>
            <button style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              color: '#b45309',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              <Brain style={{ width: '1.25rem', height: '1.25rem' }} />
              Memories
            </button>
            <button style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              color: '#b45309',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              <Youtube style={{ width: '1.25rem', height: '1.25rem' }} />
              Watch Together
            </button>
            <button style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.75rem', 
              background: 'transparent', 
              color: '#b45309',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              <BookOpen style={{ width: '1.25rem', height: '1.25rem' }} />
              Knowledge Base
            </button>
          </nav>

          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'linear-gradient(135deg, #fed7aa, #fecdd3)', 
            borderRadius: '1rem' 
          }}>
            <p style={{ fontSize: '0.875rem', color: '#78350f', fontWeight: 500, marginBottom: '0.5rem' }}>Daily Insight</p>
            <p style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.5 }}>
              "The quieter you become, the more you can hear." — Ram Dass
            </p>
          </div>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #fb923c, #f43f5e)', 
                  flexShrink: 0,
                  boxShadow: '0 4px 6px -1px rgba(251, 146, 60, 0.3)'
                }} />
                <div style={{ 
                  background: 'white', 
                  borderRadius: '1.5rem', 
                  borderTopLeftRadius: '0.5rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #fef3c7'
                }}>
                  <p style={{ color: '#78350f', lineHeight: 1.6 }}>
                    Good morning! It's so nice to see you. I hope you're having a wonderful day. Is there something you'd like to talk about or explore together?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ 
                  background: 'linear-gradient(to right, #fb923c, #f43f5e)', 
                  borderRadius: '1.5rem', 
                  borderTopRightRadius: '0.5rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ color: 'white', lineHeight: 1.6 }}>
                    I'm feeling a bit overwhelmed today. Work has been intense.
                  </p>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: '#fde68a', 
                  flexShrink: 0 
                }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #fb923c, #f43f5e)', 
                  flexShrink: 0,
                  boxShadow: '0 4px 6px -1px rgba(251, 146, 60, 0.3)'
                }} />
                <div style={{ 
                  background: 'white', 
                  borderRadius: '1.5rem', 
                  borderTopLeftRadius: '0.5rem', 
                  padding: '1rem 1.25rem', 
                  maxWidth: '80%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #fef3c7'
                }}>
                  <p style={{ color: '#78350f', lineHeight: 1.6 }}>
                    I hear you, and I'm glad you're sharing that with me. Work stress can really build up. Would you like to talk through what's on your plate, or would a short guided relaxation help you reset?
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.5)', borderTop: '1px solid rgba(217, 119, 6, 0.2)' }}>
            <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                background: 'white', 
                borderRadius: '9999px', 
                padding: '0.75rem 1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #fde68a'
              }}>
                <input
                  type="text"
                  placeholder="Share what's on your mind..."
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    color: '#78350f', 
                    border: 'none', 
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
                <button style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: 'transparent', 
                  color: '#f59e0b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                  <Mic style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                <button style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(to right, #fb923c, #f43f5e)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(251, 146, 60, 0.3)'
                }}>
                  <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DesignC() {
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
      
      <div style={{ 
        position: 'relative', 
        padding: '1.5rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
        background: 'rgba(0, 0, 0, 0.5)', 
        backdropFilter: 'blur(8px)' 
      }}>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
          <strong style={{ color: 'white' }}>Design C: Cyberpunk / Tech-Forward</strong> — Dark theme, neon accents, futuristic glass panels
        </p>
      </div>

      <div style={{ position: 'relative', display: 'flex', height: 'calc(100vh - 140px)' }}>
        <aside style={{ 
          width: '18rem', 
          borderRight: '1px solid rgba(255, 255, 255, 0.1)', 
          padding: '1rem', 
          background: 'rgba(0, 0, 0, 0.3)', 
          backdropFilter: 'blur(20px)' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '2rem', 
            padding: '0.75rem', 
            borderRadius: '0.75rem', 
            background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(34, 211, 238, 0.2))', 
            border: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '0.75rem', 
              background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Zap style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontWeight: 'bold', color: 'white' }}>MILLA.AI</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ 
                  width: '0.5rem', 
                  height: '0.5rem', 
                  borderRadius: '50%', 
                  background: '#34d399',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Online</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Navigation</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(34, 211, 238, 0.3)', 
                color: '#22d3ee', 
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MessageCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                  Neural Chat
                </div>
                <ChevronRight style={{ width: '1rem', height: '1rem' }} />
              </button>
              <button style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                background: 'transparent', 
                border: 'none', 
                color: '#9ca3af',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Brain style={{ width: '1.25rem', height: '1.25rem' }} />
                  Memory Core
                </div>
                <ChevronRight style={{ width: '1rem', height: '1rem', opacity: 0 }} />
              </button>
              <button style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                background: 'transparent', 
                border: 'none', 
                color: '#9ca3af',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Play style={{ width: '1.25rem', height: '1.25rem' }} />
                  Media Hub
                </div>
                <ChevronRight style={{ width: '1rem', height: '1rem', opacity: 0 }} />
              </button>
              <button style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                background: 'transparent', 
                border: 'none', 
                color: '#9ca3af',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Palette style={{ width: '1.25rem', height: '1.25rem' }} />
                  Creative Lab
                </div>
                <ChevronRight style={{ width: '1rem', height: '1rem', opacity: 0 }} />
              </button>
            </nav>
          </div>

          <div style={{ 
            padding: '1rem', 
            borderRadius: '0.75rem', 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1))', 
            border: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Volume2 style={{ width: '1rem', height: '1rem', color: '#a78bfa' }} />
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Voice Mode</span>
            </div>
            <div style={{ height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  style={{ 
                    width: '0.25rem', 
                    background: 'linear-gradient(to top, #8b5cf6, #22d3ee)', 
                    borderRadius: '9999px',
                    height: `${Math.random() * 24 + 8}px`
                  }}
                />
              ))}
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '0.5rem', 
                  background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
                  flexShrink: 0,
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
                }} />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.125rem', 
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
                  <p style={{ color: '#e5e7eb', lineHeight: 1.6 }}>
                    <span style={{ color: '#22d3ee' }}>[MILLA.AI]</span> Systems online. Neural pathways synchronized. Ready to assist with any task — from complex analysis to creative exploration. What would you like to explore today?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ 
                  background: 'linear-gradient(to right, rgba(139, 92, 246, 0.8), rgba(192, 38, 211, 0.8))', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopRightRadius: '0.125rem', 
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
                  <p style={{ color: 'white', lineHeight: 1.6 }}>
                    I want to analyze some code patterns and get your thoughts on architecture
                  </p>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '0.5rem', 
                  background: '#1f2937', 
                  flexShrink: 0,
                  border: '1px solid #374151'
                }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '0.5rem', 
                  background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', 
                  flexShrink: 0,
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
                }} />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(20px)', 
                  borderRadius: '1rem', 
                  borderTopLeftRadius: '0.125rem', 
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
                  <p style={{ color: '#e5e7eb', lineHeight: 1.6 }}>
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
                borderRadius: '0.75rem', 
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
                  placeholder="Enter command or message..."
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
                  borderRadius: '0.5rem', 
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
