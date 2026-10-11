import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIncidents, updateIncidentStatus } from '@/services/api';
import { SeverityBadge, Drawer, ConfidenceBar, Skeleton, EmptyState } from '@/components/ui';
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '@/types';
import { ShieldAlert, Search, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  calibration_drift: 'Calibration Drift',
  flatline: 'Flatline',
  spatial_inconsistency: 'Spatial Inconsistency',
  unusual_spike: 'Unusual Spike',
  stale_data: 'Stale Data',
  simulated_manipulation: 'Simulated Manipulation',
  unknown_anomaly: 'Unknown Anomaly',
};

const STATUS_ICONS: Record<IncidentStatus, React.FC<{ size?: number }>> = {
  open: AlertCircle,
  investigating: Clock,
  resolved: CheckCircle,
  false_positive: XCircle,
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  open: 'var(--clr-critical)',
  investigating: 'var(--clr-warning)',
  resolved: 'var(--clr-normal)',
  false_positive: 'var(--clr-unknown)',
};

function IncidentDetailDrawer({ incident, onClose }: { incident: Incident | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(incident?.analyst_notes ?? '');
  const [newStatus, setNewStatus] = useState<IncidentStatus | ''>(incident?.status ?? '');

  const mutation = useMutation({
    mutationFn: ({ status, n }: { status: IncidentStatus; n: string }) =>
      updateIncidentStatus(incident!.incident_id, status, n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident status updated');
    },
    onError: () => toast.error('Failed to update incident'),
  });

  if (!incident) return null;
  const StatusIcon = STATUS_ICONS[incident.status];

  return (
    <Drawer open title={`Incident: ${incident.incident_id}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Sim banner */}
        {incident.is_simulated && (
          <div className="sim-banner" style={{ display: 'flex' }}>⚗ SIMULATION — Not a real security event</div>
        )}

        {/* Status + severity */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <SeverityBadge severity={incident.severity} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: STATUS_COLORS[incident.status], fontWeight: 600 }}>
            <StatusIcon size={13} />
            {incident.status.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span className="badge badge-unknown">{INCIDENT_TYPE_LABELS[incident.type]}</span>
        </div>

        {/* Summary */}
        <div className="card-inset" style={{ padding: 12 }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{incident.summary}</p>
        </div>

        {/* Timeline */}
        <div style={{ fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'First detected', ts: incident.created_at },
              { label: 'Last observed', ts: incident.last_observed ?? incident.created_at },
            ].map(({ label, ts }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {format(new Date(ts), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detector evidence */}
        {incident.detector_reasons && incident.detector_reasons.length > 0 && (
          <div className="card-inset" style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
              Detector Evidence
            </div>
            <ul style={{ paddingLeft: 16 }}>
              {incident.detector_reasons.map((r, i) => (
                <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.5 }}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence */}
        {incident.confidence != null && (
          <ConfidenceBar value={incident.confidence} label="Detector confidence" />
        )}

        {/* Affected sensors */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Affected Sensors</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {incident.sensor_ids.map(id => (
              <code key={id} style={{
                background: 'var(--accent-soft)', color: 'var(--accent)',
                padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontFamily: 'monospace',
              }}>{id}</code>
            ))}
          </div>
        </div>

        <div className="separator" />

        {/* Status update */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Update Status</div>
          <select
            className="input"
            value={newStatus}
            onChange={e => setNewStatus(e.target.value as IncidentStatus)}
            style={{ marginBottom: 8 }}
            aria-label="New incident status"
          >
            <option value="">— select —</option>
            {(['open', 'investigating', 'resolved', 'false_positive'] as IncidentStatus[]).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <textarea
            className="input"
            rows={3}
            placeholder="Analyst notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ resize: 'vertical', marginBottom: 8 }}
            aria-label="Analyst notes"
          />
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!newStatus || mutation.isPending}
            onClick={() => newStatus && mutation.mutate({ status: newStatus as IncidentStatus, n: notes })}
          >
            {mutation.isPending ? 'Saving…' : 'Update Status'}
          </button>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)' }}>
          <strong>Disclaimer:</strong> Anomaly flags represent detector findings, not confirmed attacks. Investigate field conditions before taking operational action.
        </div>
      </div>
    </Drawer>
  );
}

export default function IncidentsPage() {
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
  });

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IncidentType | 'all'>('all');
  const [selected, setSelected] = useState<Incident | null>(null);

  const filtered = useMemo(() => {
    let list = [...incidents];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.incident_id.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.sensor_ids.some(id => id.toLowerCase().includes(q))
      );
    }
    if (severityFilter !== 'all') list = list.filter(i => i.severity === severityFilter);
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [incidents, search, severityFilter, statusFilter, typeFilter]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Integrity Incidents</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
          Sensor anomaly and data integrity events · Synthetic demo data
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search incident ID, sensor, summary…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search incidents"
          />
        </div>
        <select className="input" style={{ width: 'auto' }} value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)} aria-label="Filter by severity">
          <option value="all">All severities</option>
          {(['low', 'medium', 'high', 'critical'] as IncidentSeverity[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {(['open', 'investigating', 'resolved', 'false_positive'] as IncidentStatus[]).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select className="input" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} aria-label="Filter by type">
          <option value="all">All types</option>
          {Object.entries(INCIDENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setSeverityFilter('all'); setStatusFilter('all'); setTypeFilter('all'); }}>
          Reset
        </button>
      </div>

      {/* Incident list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={90} />)
        ) : filtered.length === 0 ? (
          <EmptyState title="No incidents found" description="Adjust filters or reset to see all incidents." icon={<ShieldAlert />} />
        ) : (
          filtered.map(inc => {
            const StatusIcon = STATUS_ICONS[inc.status];
            return (
              <div
                key={inc.incident_id}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${STATUS_COLORS[inc.status]}`,
                  transition: 'transform 0.1s',
                  padding: '14px 16px',
                }}
                onClick={() => setSelected(inc)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelected(inc)}
                role="button"
                aria-label={`View incident ${inc.incident_id}`}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <code style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 700 }}>{inc.incident_id}</code>
                    <SeverityBadge severity={inc.severity} />
                    <span className="badge badge-unknown" style={{ fontSize: '0.67rem' }}>{INCIDENT_TYPE_LABELS[inc.type]}</span>
                    {inc.is_simulated && <span className="sim-banner" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>SIM</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: STATUS_COLORS[inc.status], fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                    <StatusIcon size={13} />
                    <span>{inc.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                  {inc.summary.slice(0, 160)}{inc.summary.length > 160 ? '…' : ''}
                </p>

                <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <span>Sensors: {inc.sensor_ids.join(', ')}</span>
                  <span>{formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}</span>
                  {inc.confidence != null && <span>Confidence: {Math.round(inc.confidence * 100)}%</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <IncidentDetailDrawer incident={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
