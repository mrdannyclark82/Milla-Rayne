import { useState, useEffect } from 'react';
import {
  X,
  GitBranch,
  Check,
  XCircle,
  Play,
  Eye,
  Code,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';

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

interface FeatureDetail {
  sandbox: {
    id: string;
    name: string;
    description: string;
    branchName: string;
    status: string;
  };
  feature: SandboxFeature & { content?: string };
  testResults: Array<{
    id: string;
    testType: string;
    passed: boolean;
    details: string;
    timestamp: number;
    duration: number;
  }>;
  resolvedFiles: Array<{ path: string; content: string; source: string }>;
}

export function SandboxManager({
  isOpen,
  onClose,
  onOpenIDE,
}: SandboxManagerProps) {
  const [sandboxes, setSandboxes] = useState<SandboxEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSandbox, setExpandedSandbox] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [viewDetail, setViewDetail] = useState<FeatureDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSandboxes();
    }
  }, [isOpen]);

  const fetchSandboxes = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const response = await fetch('/api/sandboxes');
      if (response.ok) {
        const data = await response.json();
        setSandboxes(data.sandboxes || []);
      } else {
        setSandboxes([]);
        setActionError('Failed to load sandboxes from server');
      }
    } catch (error) {
      setSandboxes([]);
      setActionError('Could not reach sandbox API');
    }
    setLoading(false);
  };

  const applyFeatureUpdate = (
    sandboxId: string,
    featureId: string,
    patch: Partial<SandboxFeature>
  ) => {
    setSandboxes((prev) =>
      prev.map((s) =>
        s.id === sandboxId
          ? {
              ...s,
              features: s.features.map((f) =>
                f.id === featureId ? { ...f, ...patch } : f
              ),
            }
          : s
      )
    );
  };

  const handleApprove = async (sandboxId: string, featureId: string) => {
    setActionLoading(`${sandboxId}-${featureId}-approve`);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/sandboxes/${sandboxId}/features/${featureId}/approve`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Approve failed');
      }
      if (data.feature) {
        applyFeatureUpdate(sandboxId, featureId, data.feature);
      } else {
        applyFeatureUpdate(sandboxId, featureId, { status: 'approved' });
      }
      // Confirm from server so refresh matches
      await fetchSandboxes();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Approve failed'
      );
    }
    setActionLoading(null);
  };

  const handleReject = async (sandboxId: string, featureId: string) => {
    setActionLoading(`${sandboxId}-${featureId}-reject`);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/sandboxes/${sandboxId}/features/${featureId}/reject`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Reject failed');
      }
      if (data.feature) {
        applyFeatureUpdate(sandboxId, featureId, data.feature);
      } else {
        applyFeatureUpdate(sandboxId, featureId, { status: 'rejected' });
      }
      await fetchSandboxes();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Reject failed'
      );
    }
    setActionLoading(null);
  };

  const handleRunTests = async (sandboxId: string, featureId: string) => {
    setActionLoading(`${sandboxId}-${featureId}-test`);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/sandboxes/${sandboxId}/features/${featureId}/test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testType: 'unit' }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Test failed');
      }
      if (data.feature) {
        applyFeatureUpdate(sandboxId, featureId, data.feature);
      }
      // Surface honest result (structural vs real — never random theater)
      const result = data.result || data;
      const mode = result.mode || 'structural';
      const passed = result.passed;
      const detail = result.details || '';
      if (passed) {
        setActionError(null);
        // brief success via error banner slot is wrong color — use console + optional
        console.log(`[Sandbox Test] ${mode} PASS: ${detail}`);
      } else {
        setActionError(
          `Check ${mode}: failed — ${detail || 'see feature details'}`
        );
      }
      // Stash last test message on a toast-like line
      setLastTestSummary(
        `${passed ? 'PASS' : 'FAIL'} (${mode}): ${detail.slice(0, 180)}`
      );
      await fetchSandboxes();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Test failed');
    }
    setActionLoading(null);
  };

  const handleView = async (sandboxId: string, featureId: string) => {
    setViewLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/sandboxes/${sandboxId}/features/${featureId}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not load feature');
      }
      setViewDetail({
        sandbox: data.sandbox,
        feature: data.feature,
        testResults: data.testResults || [],
        resolvedFiles: data.resolvedFiles || [],
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'View failed'
      );
    }
    setViewLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'rgba(34, 197, 94, 0.2)',
          border: 'rgba(34, 197, 94, 0.4)',
          text: '#22c55e',
        };
      case 'rejected':
        return {
          bg: 'rgba(239, 68, 68, 0.2)',
          border: 'rgba(239, 68, 68, 0.4)',
          text: '#ef4444',
        };
      case 'testing':
        return {
          bg: 'rgba(34, 211, 238, 0.2)',
          border: 'rgba(34, 211, 238, 0.4)',
          text: '#22d3ee',
        };
      case 'draft':
        return {
          bg: 'rgba(139, 92, 246, 0.2)',
          border: 'rgba(139, 92, 246, 0.4)',
          text: '#a78bfa',
        };
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.2)',
          border: 'rgba(107, 114, 128, 0.4)',
          text: '#6b7280',
        };
    }
  };

  const getSandboxStatusColor = (status: string) => {
    switch (status) {
      case 'merged':
        return {
          bg: 'rgba(34, 197, 94, 0.2)',
          border: 'rgba(34, 197, 94, 0.4)',
          text: '#22c55e',
        };
      case 'testing':
        return {
          bg: 'rgba(251, 191, 36, 0.2)',
          border: 'rgba(251, 191, 36, 0.4)',
          text: '#fbbf24',
        };
      case 'active':
        return {
          bg: 'rgba(34, 211, 238, 0.2)',
          border: 'rgba(34, 211, 238, 0.4)',
          text: '#22d3ee',
        };
      case 'archived':
        return {
          bg: 'rgba(107, 114, 128, 0.2)',
          border: 'rgba(107, 114, 128, 0.4)',
          text: '#6b7280',
        };
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.2)',
          border: 'rgba(107, 114, 128, 0.4)',
          text: '#6b7280',
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
      />

      <div
        style={{
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
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1))',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <GitBranch
              style={{ width: '1.5rem', height: '1.5rem', color: '#22d3ee' }}
            />
            <h2
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: 600,
              }}
            >
              Sandbox Environments
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {actionError && (
            <div
              style={{
                marginBottom: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.8125rem',
              }}
            >
              {actionError}
            </div>
          )}
          {lastTestSummary && !actionError && (
            <div
              style={{
                marginBottom: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(34, 211, 238, 0.12)',
                border: '1px solid rgba(34, 211, 238, 0.35)',
                color: '#a5f3fc',
                fontSize: '0.8125rem',
              }}
            >
              {lastTestSummary}
            </div>
          )}
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem',
                color: '#6b7280',
              }}
            >
              <Loader2
                style={{
                  width: '2rem',
                  height: '2rem',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
          ) : sandboxes.length === 0 ? (
            <div
              style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}
            >
              <Sparkles
                style={{
                  width: '3rem',
                  height: '3rem',
                  margin: '0 auto 1rem',
                  opacity: 0.5,
                }}
              />
              <p>No sandbox environments found</p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {sandboxes.map((sandbox) => {
                const isExpanded = expandedSandbox === sandbox.id;
                const statusColor = getSandboxStatusColor(sandbox.status);
                const approvedCount = sandbox.features.filter(
                  (f) => f.status === 'approved'
                ).length;
                const pendingCount = sandbox.features.filter(
                  (f) => f.status !== 'approved' && f.status !== 'rejected'
                ).length;

                return (
                  <div
                    key={sandbox.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Sandbox Header */}
                    <div
                      onClick={() =>
                        setExpandedSandbox(isExpanded ? null : sandbox.id)
                      }
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
                        <ChevronDown
                          style={{
                            width: '1rem',
                            height: '1rem',
                            color: '#6b7280',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <ChevronRight
                          style={{
                            width: '1rem',
                            height: '1rem',
                            color: '#6b7280',
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span
                            style={{
                              color: '#fff',
                              fontWeight: 500,
                              fontSize: '0.9375rem',
                            }}
                          >
                            {sandbox.name}
                          </span>
                          <span
                            style={{
                              padding: '0.125rem 0.5rem',
                              fontSize: '0.6875rem',
                              borderRadius: '0.25rem',
                              background: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`,
                              textTransform: 'capitalize',
                            }}
                          >
                            {sandbox.status}
                          </span>
                          {sandbox.readyForProduction && (
                            <span
                              style={{
                                padding: '0.125rem 0.5rem',
                                fontSize: '0.6875rem',
                                borderRadius: '0.25rem',
                                background: 'rgba(34, 197, 94, 0.2)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                              }}
                            >
                              Ready
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            color: '#6b7280',
                            fontSize: '0.8125rem',
                          }}
                        >
                          {sandbox.description}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{ color: '#22c55e', fontSize: '0.75rem' }}
                          >
                            {approvedCount} approved
                          </div>
                          <div
                            style={{ color: '#fbbf24', fontSize: '0.75rem' }}
                          >
                            {pendingCount} pending
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Features */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          padding: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                          }}
                        >
                          {sandbox.features.map((feature) => {
                            const featureColor = getStatusColor(feature.status);
                            const isLoading = actionLoading?.startsWith(
                              `${sandbox.id}-${feature.id}`
                            );

                            return (
                              <div
                                key={feature.id}
                                style={{
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  borderRadius: '0.5rem',
                                  padding: '0.75rem 1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: '#e5e7eb',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {feature.name}
                                    </span>
                                    <span
                                      style={{
                                        padding: '0.125rem 0.375rem',
                                        fontSize: '0.625rem',
                                        borderRadius: '0.25rem',
                                        background: featureColor.bg,
                                        color: featureColor.text,
                                        border: `1px solid ${featureColor.border}`,
                                        textTransform: 'capitalize',
                                      }}
                                    >
                                      {feature.status}
                                    </span>
                                  </div>
                                  <p
                                    style={{
                                      margin: 0,
                                      color: '#6b7280',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    {feature.description}
                                  </p>
                                  <div
                                    style={{
                                      marginTop: '0.375rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.75rem',
                                      color: '#6b7280',
                                      fontSize: '0.6875rem',
                                    }}
                                  >
                                    <span style={{ color: '#22c55e' }}>
                                      Passed: {feature.testsPassed}
                                    </span>
                                    <span style={{ color: '#ef4444' }}>
                                      Failed: {feature.testsFailed}
                                    </span>
                                    <span
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                      }}
                                    >
                                      <Clock
                                        style={{
                                          width: '0.625rem',
                                          height: '0.625rem',
                                        }}
                                      />
                                      {new Date(
                                        feature.addedAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  {feature.status !== 'approved' &&
                                    feature.status !== 'rejected' && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleRunTests(
                                              sandbox.id,
                                              feature.id
                                            )
                                          }
                                          disabled={isLoading}
                                          style={{
                                            padding: '0.375rem 0.625rem',
                                            borderRadius: '0.375rem',
                                            background:
                                              'rgba(139, 92, 246, 0.2)',
                                            border:
                                              '1px solid rgba(139, 92, 246, 0.4)',
                                            color: '#a78bfa',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                          }}
                                        >
                                          {isLoading &&
                                          actionLoading?.includes('test') ? (
                                            <Loader2
                                              style={{
                                                width: '0.75rem',
                                                height: '0.75rem',
                                                animation:
                                                  'spin 1s linear infinite',
                                              }}
                                            />
                                          ) : (
                                            <Play
                                              style={{
                                                width: '0.75rem',
                                                height: '0.75rem',
                                              }}
                                            />
                                          )}
                                          Check
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleApprove(
                                              sandbox.id,
                                              feature.id
                                            )
                                          }
                                          disabled={isLoading}
                                          style={{
                                            padding: '0.375rem 0.625rem',
                                            borderRadius: '0.375rem',
                                            background:
                                              'rgba(34, 197, 94, 0.2)',
                                            border:
                                              '1px solid rgba(34, 197, 94, 0.4)',
                                            color: '#22c55e',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                          }}
                                        >
                                          {isLoading &&
                                          actionLoading?.includes('approve') ? (
                                            <Loader2
                                              style={{
                                                width: '0.75rem',
                                                height: '0.75rem',
                                                animation:
                                                  'spin 1s linear infinite',
                                              }}
                                            />
                                          ) : (
                                            <Check
                                              style={{
                                                width: '0.75rem',
                                                height: '0.75rem',
                                              }}
                                            />
                                          )}
                                          Approve
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleReject(sandbox.id, feature.id)
                                          }
                                          disabled={isLoading}
                                          style={{
                                            padding: '0.375rem 0.625rem',
                                            borderRadius: '0.375rem',
                                            background:
                                              'rgba(239, 68, 68, 0.2)',
                                            border:
                                              '1px solid rgba(239, 68, 68, 0.4)',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                          }}
                                        >
                                          {isLoading &&
                                          actionLoading?.includes('reject') ? (
                                            <Loader2
                                              style={{
                                                width: '0.75rem',
                                                height: '0.75rem',
                                                animation:
                                                  'spin 1s linear infinite',
                                              }}
                                            />
                                          ) : (
                                            <XCircle
                                              style={{
                                                width: '0.75rem',
                                                height: '0.75rem',
                                              }}
                                            />
                                          )}
                                          Reject
                                        </button>
                                      </>
                                    )}
                                  {onOpenIDE && (
                                    <button
                                      onClick={() =>
                                        onOpenIDE(sandbox.id, feature.id)
                                      }
                                      style={{
                                        padding: '0.375rem 0.625rem',
                                        borderRadius: '0.375rem',
                                        background: 'rgba(34, 211, 238, 0.2)',
                                        border:
                                          '1px solid rgba(34, 211, 238, 0.4)',
                                        color: '#22d3ee',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                      }}
                                    >
                                      <Code
                                        style={{
                                          width: '0.75rem',
                                          height: '0.75rem',
                                        }}
                                      />
                                      IDE
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleView(sandbox.id, feature.id)
                                    }
                                    disabled={viewLoading}
                                    style={{
                                      padding: '0.375rem 0.625rem',
                                      borderRadius: '0.375rem',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border:
                                        '1px solid rgba(255, 255, 255, 0.1)',
                                      color: '#9ca3af',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {viewLoading ? (
                                      <Loader2
                                        style={{
                                          width: '0.75rem',
                                          height: '0.75rem',
                                          animation: 'spin 1s linear infinite',
                                        }}
                                      />
                                    ) : (
                                      <Eye
                                        style={{
                                          width: '0.75rem',
                                          height: '0.75rem',
                                        }}
                                      />
                                    )}
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
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
            {sandboxes.length} sandbox{sandboxes.length !== 1 ? 'es' : ''} |{' '}
            {sandboxes.reduce((sum, s) => sum + s.features.length, 0)} features
          </div>
          <button
            onClick={fetchSandboxes}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              background:
                'linear-gradient(to right, rgba(139, 92, 246, 0.3), rgba(34, 211, 238, 0.3))',
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

      {/* Feature View Detail */}
      {viewDetail && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.55)',
          }}
          onClick={() => setViewDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(640px, 92vw)',
              maxHeight: '80vh',
              overflow: 'auto',
              background: 'rgba(12, 12, 18, 0.98)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                  }}
                >
                  {viewDetail.feature.name}
                </h3>
                <p
                  style={{
                    margin: '0.35rem 0 0',
                    color: '#9ca3af',
                    fontSize: '0.8125rem',
                  }}
                >
                  {viewDetail.sandbox.name} · {viewDetail.sandbox.branchName}
                </p>
              </div>
              <button
                onClick={() => setViewDetail(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: '1.125rem', height: '1.125rem' }} />
              </button>
            </div>

            <div
              style={{
                marginBottom: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.6875rem',
                  textTransform: 'capitalize',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                }}
              >
                {viewDetail.feature.status}
              </span>
              <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>
                Passed: {viewDetail.feature.testsPassed}
              </span>
              <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                Failed: {viewDetail.feature.testsFailed}
              </span>
            </div>

            <p
              style={{
                color: '#d1d5db',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                marginBottom: '1rem',
              }}
            >
              {viewDetail.feature.description}
            </p>

            <h4
              style={{
                margin: '0 0 0.5rem',
                color: '#e5e7eb',
                fontSize: '0.8125rem',
              }}
            >
              Files ({viewDetail.resolvedFiles.length})
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {viewDetail.resolvedFiles.map((file) => (
                <div
                  key={file.path}
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '0.375rem 0.625rem',
                      color: '#22d3ee',
                      fontSize: '0.75rem',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{file.path}</span>
                    <span style={{ color: '#6b7280' }}>{file.source}</span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '0.625rem',
                      color: '#d1d5db',
                      fontSize: '0.7rem',
                      maxHeight: '160px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {file.content.slice(0, 4000)}
                    {file.content.length > 4000 ? '\n…' : ''}
                  </pre>
                </div>
              ))}
            </div>

            {viewDetail.testResults.length > 0 && (
              <>
                <h4
                  style={{
                    margin: '0 0 0.5rem',
                    color: '#e5e7eb',
                    fontSize: '0.8125rem',
                  }}
                >
                  Recent tests
                </h4>
                <ul
                  style={{
                    margin: '0 0 1rem',
                    paddingLeft: '1.1rem',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                  }}
                >
                  {viewDetail.testResults
                    .slice(-8)
                    .reverse()
                    .map((t) => (
                      <li key={t.id} style={{ marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            color: t.passed ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {t.passed ? 'PASS' : 'FAIL'}
                        </span>{' '}
                        {t.testType} — {t.details} (
                        {Math.round(t.duration)}ms)
                      </li>
                    ))}
                </ul>
              </>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end',
              }}
            >
              {onOpenIDE && (
                <button
                  onClick={() => {
                    const sid = viewDetail.sandbox.id;
                    const fid = viewDetail.feature.id;
                    setViewDetail(null);
                    onOpenIDE(sid, fid);
                  }}
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(34, 211, 238, 0.2)',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                    color: '#22d3ee',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Code style={{ width: '0.875rem', height: '0.875rem' }} />
                  Open in IDE
                </button>
              )}
              <button
                onClick={() => setViewDetail(null)}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
