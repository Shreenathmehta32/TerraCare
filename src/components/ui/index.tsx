import React from 'react';
import type { IntegrityStatus, IncidentSeverity, DataFreshness } from '@/types';

// ── Status Badge ──────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: IntegrityStatus;
  label?: string;
}
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const map: Record<IntegrityStatus, { cls: string; text: string }> = {
    normal:            { cls: 'badge-normal',   text: 'Normal' },
    suspicious:        { cls: 'badge-critical', text: 'Suspicious' },
    under_review:      { cls: 'badge-warning',  text: 'Under Review' },
    insufficient_data: { cls: 'badge-unknown',  text: 'Insufficient Data' },
  };
  const { cls, text } = map[status] ?? { cls: 'badge-unknown', text: status };
  return (
    <span className={`badge ${cls}`} aria-label={`Integrity status: ${text}`}>
      {label ?? text}
    </span>
  );
}

// ── Severity Badge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const map: Record<IncidentSeverity, string> = {
    low: 'badge-info', medium: 'badge-warning',
    high: 'badge-critical', critical: 'badge-critical',
  };
  return (
    <span className={`badge ${map[severity]}`} aria-label={`Severity: ${severity}`}>
      {severity.toUpperCase()}
    </span>
  );
}

// ── Freshness Badge ───────────────────────────────────────────────────────────
export function FreshnessBadge({ freshness }: { freshness: DataFreshness }) {
  const map: Record<DataFreshness, { cls: string; text: string }> = {
    fresh:       { cls: 'badge-normal',  text: 'Fresh' },
    stale:       { cls: 'badge-warning', text: 'Stale' },
    unavailable: { cls: 'badge-unknown', text: 'No Data' },
  };
  const { cls, text } = map[freshness];
  return <span className={`badge ${cls}`}>{text}</span>;
}

// ── Provenance Label ──────────────────────────────────────────────────────────
export function ProvenanceLabel({ provenance, isSimulated }: { provenance: string; isSimulated?: boolean }) {
  if (isSimulated || provenance === 'synthetic') {
    return (
      <span className="sim-banner">
        ⚗ SYNTHETIC
      </span>
    );
  }
  return (
    <span className="badge badge-info">
      {provenance.toUpperCase()}
    </span>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 20, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 'var(--r-sm)', ...style }}
      aria-hidden="true"
    />
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`card ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>{title}</h2>
        {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', color: 'var(--text-secondary)', textAlign: 'center',
    }}>
      {icon && <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.4 }}>{icon}</div>}
      <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>{title}</h4>
      {description && <p style={{ fontSize: '0.8rem', maxWidth: 320 }}>{description}</p>}
    </div>
  );
}

// ── Confidence bar ────────────────────────────────────────────────────────────
export function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(value * 100);
  const color = value > 0.7 ? 'var(--clr-critical)' : value > 0.4 ? 'var(--clr-warning)' : 'var(--clr-normal)';
  return (
    <div>
      {label && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 3 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--surface-inset)', borderRadius: 3, boxShadow: 'var(--shadow-inset)' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color, fontFamily: 'monospace', width: 36 }}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Anomaly score pill ────────────────────────────────────────────────────────
export function AnomalyScore({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>—</span>;
  const color = score > 0.7 ? 'var(--clr-critical)' : score > 0.4 ? 'var(--clr-warning)' : 'var(--clr-normal)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 42, padding: '2px 6px', borderRadius: 6,
      background: `color-mix(in srgb, ${color} 15%, transparent)`,
      color, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace',
    }}>
      {score.toFixed(2)}
    </span>
  );
}

// ── Drawer wrapper ────────────────────────────────────────────────────────────
export function Drawer({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} role="presentation" />
      <div className="drawer" role="dialog" aria-modal aria-label={title}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          <button className="btn-ghost btn" onClick={onClose} aria-label="Close panel" style={{ padding: 6 }}>
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {children}
        </div>
      </div>
    </>
  );
}
