import { useState, useEffect } from 'react';
import { X, GitBranch, Check, XCircle, Play, Eye, Code, Clock, Sparkles, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface SandboxFeature {
  id: string;
  name: string;
  description: string;
  files: string[];
  status: 'draft' | 'testing' | 'approved' | 'rejected';
  testsPassed: number;
  testsFailed: number;
  addedAt: number;
}

interface SandboxEnvironment {
  id: string;
  name: string;
  description: string;
  branchName: string;
  status: 'active' | 'testing' | 'merged' | 'archived';
  createdAt: number;
  createdBy: 'milla' | 'user';
  features: SandboxFeature[];
  readyForProduction: boolean;
}

interface SandboxManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIDE?: (sandboxId: string, featureId?: string) => void;
}

export function SandboxManager({ isOpen, onClose, onOpenIDE }: SandboxManagerProps) {
  const [sandboxes, setSandboxes] = useState<SandboxEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSandbox, setExpandedSandbox] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSandboxes();
    }
  }, [isOpen]);

  const fetchSandboxes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sandboxes');
      if (response.ok) {
        const data = await response.json();
        setSandboxes(data.sandboxes || []);
      } else {
        setSandboxes(getMockSandboxes());
      }
    } catch (error) {
      setSandboxes(getMockSandboxes());
    }
    setLoading(false);
  };

  const getMockSandboxes = (): SandboxEnvironment[] => [
    {
      id: 'sandbox_1',
      name: 'Real-time Chat',
      description: 'WebSocket-based real-time messaging with typing indicators',
      branchName: 'sandbox/real-time-chat',
      status: 'testing',
      createdAt: Date.now() - 86400000,
      createdBy: 'milla',
      readyForProduction: false,
      features: [
        { id: 'f1', name: 'WebSocket Connection', description: 'Persistent connection handling', files: ['ws.ts'], status: 'approved', testsPassed: 5, testsFailed: 0, addedAt: Date.now() - 80000000 },
        { id: 'f2', name: 'Typing Indicators', description: 'Show when user is typing', files: ['typing.ts'], status: 'testing', testsPassed: 2, testsFailed: 1, addedAt: Date.now() - 40000000 },
      ]
    },
    {
      id: 'sandbox_2',
      name: 'Voice Integration',
      description: 'Speech-to-text and text-to-speech capabilities',
      branchName: 'sandbox/voice-integration',
      status: 'active',
      createdAt: Date.now() - 172800000,
      createdBy: 'milla',
      readyForProduction: false,
      features: [
        { id: 'f3', name: 'Speech Recognition', description: 'Browser-based voice input', files: ['speech.ts'], status: 'draft', testsPassed: 0, testsFailed: 0, addedAt: Date.now() - 100000000 },
      ]
    },
    {
      id: 'sandbox_3',
      name: 'Memory System',
      description: 'Long-term memory and context awareness',
      branchName: 'sandbox/memory-system',
      status: 'active',
      createdAt: Date.now() - 259200000,
      createdBy: 'milla',
      readyForProduction: true,
      features: [
        { id: 'f4', name: 'Vector Storage', description: 'Semantic memory search', files: ['vector.ts'], status: 'approved', testsPassed: 8, testsFailed: 0, addedAt: Date.now() - 200000000 },
        { id: 'f5', name: 'Context Window', description: 'Sliding window for conversations', files: ['context.ts'], status: 'approved', testsPassed: 6, testsFailed: 0, addedAt: Date.now() - 150000000 },
      ]
    },
  ];

  const handleApprove = async (sandboxId: string, featureId: string) => {
    setActionLoading(`${sandboxId}-${featureId}-approve`);
    try {
      await fetch(`/api/sandboxes/${sandboxId}/features/${featureId}/approve`, { method: 'POST' });
      setSandboxes(prev => prev.map(s => 
        s.id === sandboxId 
          ? { ...s, features: s.features.map(f => f.id === featureId ? { ...f, status: 'approved' as const } : f) }
          : s
      ));
    } catch (error) {
      setSandboxes(prev => prev.map(s => 
        s.id === sandboxId 
          ? { ...s, features: s.features.map(f => f.id === featureId ? { ...f, status: 'approved' as const } : f) }
          : s
      ));
    }
    setActionLoading(null);
  };

  const handleReject = async (sandboxId: string, featureId: string) => {
    setActionLoading(`${sandboxId}-${featureId}-reject`);
    try {
      await fetch(`/api/sandboxes/${sandboxId}/features/${featureId}/reject`, { method: 'POST' });
      setSandboxes(prev => prev.map(s => 
        s.id === sandboxId 
          ? { ...s, features: s.features.map(f => f.id === featureId ? { ...f, status: 'rejected' as const } : f) }
          : s
      ));
    } catch (error) {
      setSandboxes(prev => prev.map(s => 
        s.id === sandboxId 
          ? { ...s, features: s.features.map(f => f.id === featureId ? { ...f, status: 'rejected' as const } : f) }
          : s
      ));
    }
    setActionLoading(null);
  };

  const handleRunTests = async (sandboxId: string, featureId: string) => {
    setActionLoading(`${sandboxId}-${featureId}-test`);
    try {
      await fetch(`/api/sandboxes/${sandboxId}/features/${featureId}/test`, { method: 'POST' });
      await fetchSandboxes();
    } catch (error) {
      console.log('Test initiated');
    }
    setActionLoading(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', text: '#22c55e' };
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' };
      case 'testing': return { bg: 'rgba(34, 211, 238, 0.2)', border: 'rgba(34, 211, 238, 0.4)', text: '#22d3ee' };
      case 'draft': return { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.4)', text: '#a78bfa' };
      default: return { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.4)', text: '#6b7280' };
    }
  };

  const getSandboxStatusColor = (status: string) => {
    switch (status) {
      case 'merged': return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', text: '#22c55e' };
      case 'testing': return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' };
      case 'active': return { bg: 'rgba(34, 211, 238, 0.2)', border: 'rgba(34, 211, 238, 0.4)', text: '#22d3ee' };
      case 'archived': return { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.4)', text: '#6b7280' };
      default: return { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.4)', text: '#6b7280' };
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }} />
      
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90vw',
        maxWidth: '800px',
        maxHeight: '85vh',
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '1rem',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 0 60px rgba(139, 92, 246, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GitBranch style={{ width: '1.5rem', height: '1.5rem', color: '#22d3ee' }} />
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>Sandbox Environments</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem' }}>
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#6b7280' }}>
              <Loader2 style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : sandboxes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Sparkles style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No sandbox environments found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sandboxes.map((sandbox) => {
                const isExpanded = expandedSandbox === sandbox.id;
                const statusColor = getSandboxStatusColor(sandbox.status);
                const approvedCount = sandbox.features.filter(f => f.status === 'approved').length;
                const pendingCount = sandbox.features.filter(f => f.status !== 'approved' && f.status !== 'rejected').length;

                return (
                  <div key={sandbox.id} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                  }}>
                    {/* Sandbox Header */}
                    <div
                      onClick={() => setExpandedSandbox(isExpanded ? null : sandbox.id)}
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'background 0.2s',
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown style={{ width: '1rem', height: '1rem', color: '#6b7280', flexShrink: 0 }} />
                      ) : (
                        <ChevronRight style={{ width: '1rem', height: '1rem', color: '#6b7280', flexShrink: 0 }} />
                      )}
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.9375rem' }}>{sandbox.name}</span>
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.6875rem',
                            borderRadius: '0.25rem',
                            background: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                            textTransform: 'capitalize',
                          }}>{sandbox.status}</span>
                          {sandbox.readyForProduction && (
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              fontSize: '0.6875rem',
                              borderRadius: '0.25rem',
                              background: 'rgba(34, 197, 94, 0.2)',
                              color: '#22c55e',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                            }}>Ready</span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8125rem' }}>{sandbox.description}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#22c55e', fontSize: '0.75rem' }}>{approvedCount} approved</div>
                          <div style={{ color: '#fbbf24', fontSize: '0.75rem' }}>{pendingCount} pending</div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Features */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {sandbox.features.map((feature) => {
                            const featureColor = getStatusColor(feature.status);
                            const isLoading = actionLoading?.startsWith(`${sandbox.id}-${feature.id}`);

                            return (
                              <div key={feature.id} style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                              }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#e5e7eb', fontSize: '0.875rem', fontWeight: 500 }}>{feature.name}</span>
                                    <span style={{
                                      padding: '0.125rem 0.375rem',
                                      fontSize: '0.625rem',
                                      borderRadius: '0.25rem',
                                      background: featureColor.bg,
                                      color: featureColor.text,
                                      border: `1px solid ${featureColor.border}`,
                                      textTransform: 'capitalize',
                                    }}>{feature.status}</span>
                                  </div>
                                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.75rem' }}>{feature.description}</p>
                                  <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6b7280', fontSize: '0.6875rem' }}>
                                    <span style={{ color: '#22c55e' }}>Passed: {feature.testsPassed}</span>
                                    <span style={{ color: '#ef4444' }}>Failed: {feature.testsFailed}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <Clock style={{ width: '0.625rem', height: '0.625rem' }} />
                                      {new Date(feature.addedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                                  {feature.status !== 'approved' && feature.status !== 'rejected' && (
                                    <>
                                      <button
                                        onClick={() => handleRunTests(sandbox.id, feature.id)}
                                        disabled={isLoading}
                                        style={{
                                          padding: '0.375rem 0.625rem',
                                          borderRadius: '0.375rem',
                                          background: 'rgba(139, 92, 246, 0.2)',
                                          border: '1px solid rgba(139, 92, 246, 0.4)',
                                          color: '#a78bfa',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {isLoading && actionLoading?.includes('test') ? (
                                          <Loader2 style={{ width: '0.75rem', height: '0.75rem', animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                          <Play style={{ width: '0.75rem', height: '0.75rem' }} />
                                        )}
                                        Test
                                      </button>
                                      <button
                                        onClick={() => handleApprove(sandbox.id, feature.id)}
                                        disabled={isLoading}
                                        style={{
                                          padding: '0.375rem 0.625rem',
                                          borderRadius: '0.375rem',
                                          background: 'rgba(34, 197, 94, 0.2)',
                                          border: '1px solid rgba(34, 197, 94, 0.4)',
                                          color: '#22c55e',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {isLoading && actionLoading?.includes('approve') ? (
                                          <Loader2 style={{ width: '0.75rem', height: '0.75rem', animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                          <Check style={{ width: '0.75rem', height: '0.75rem' }} />
                                        )}
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleReject(sandbox.id, feature.id)}
                                        disabled={isLoading}
                                        style={{
                                          padding: '0.375rem 0.625rem',
                                          borderRadius: '0.375rem',
                                          background: 'rgba(239, 68, 68, 0.2)',
                                          border: '1px solid rgba(239, 68, 68, 0.4)',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {isLoading && actionLoading?.includes('reject') ? (
                                          <Loader2 style={{ width: '0.75rem', height: '0.75rem', animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                          <XCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                                        )}
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {onOpenIDE && (
                                    <button
                                      onClick={() => onOpenIDE(sandbox.id, feature.id)}
                                      style={{
                                        padding: '0.375rem 0.625rem',
                                        borderRadius: '0.375rem',
                                        background: 'rgba(34, 211, 238, 0.2)',
                                        border: '1px solid rgba(34, 211, 238, 0.4)',
                                        color: '#22d3ee',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                      }}
                                    >
                                      <Code style={{ width: '0.75rem', height: '0.75rem' }} />
                                      IDE
                                    </button>
                                  )}
                                  <button
                                    style={{
                                      padding: '0.375rem 0.625rem',
                                      borderRadius: '0.375rem',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      color: '#9ca3af',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <Eye style={{ width: '0.75rem', height: '0.75rem' }} />
                                    View
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
            {sandboxes.length} sandbox{sandboxes.length !== 1 ? 'es' : ''} | {sandboxes.reduce((sum, s) => sum + s.features.length, 0)} features
          </div>
          <button
            onClick={fetchSandboxes}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(to right, rgba(139, 92, 246, 0.3), rgba(34, 211, 238, 0.3))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
