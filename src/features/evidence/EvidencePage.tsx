import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllEvidence } from '@/services/api';
import { Card, SectionHeader, Skeleton, EmptyState } from '@/components/ui';
import { FileCheck, Download, Search, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { EvidenceRecord } from '@/types';

function computeHash(data: string): string {
  // Simple non-cryptographic checksum — clearly labeled as file integrity only
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

function exportEvidence(record: EvidenceRecord) {
  const payload = JSON.stringify(record, null, 2);
  const checksum = computeHash(payload);
  const exportObj = {
    ...record,
    _export_meta: {
      exported_at: new Date().toISOString(),
      file_integrity_checksum: checksum,
      checksum_algorithm: 'simple-hash-non-cryptographic',
      note: 'This checksum verifies file integrity only, not authenticity. It is not a digital signature.',
    },
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `evidence-${record.incident_id}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Evidence exported: ${record.incident_id}`);
}

function EvidenceDetailView({ record }: { record: EvidenceRecord }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Schema info */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <code style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontFamily: 'monospace' }}>
          v{record.schema_version}
        </code>
        <span className="badge badge-unknown">{record.data_source}</span>
        {record.scenario_id && <span className="sim-banner" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>⚗ {record.scenario_id}</span>}
      </div>

      {/* Detector */}
      <div className="card-inset" style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6 }}>Detector</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Name</span>
          <span style={{ fontFamily: 'monospace' }}>{record.detector.name}</span>
          <span style={{ color: 'var(--text-secondary)' }}>Version</span>
          <span style={{ fontFamily: 'monospace' }}>{record.detector.version}</span>
        </div>
        {Object.keys(record.detector.features).length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Features</div>
            <pre style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--surface)', padding: 8, borderRadius: 6, overflow: 'auto', maxHeight: 100 }}>
              {JSON.stringify(record.detector.features, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Values */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Observed Values', data: record.observed_values },
          { label: 'Expected Values', data: record.expected_values },
        ].map(({ label, data }) => (
          <div key={label} className="card-inset" style={{ padding: 10 }}>
            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
            <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {/* Anomaly reasons */}
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Anomaly Reasons</div>
        <ul style={{ paddingLeft: 16 }}>
          {record.anomaly_reasons.map((r, i) => (
            <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.5 }}>{r}</li>
          ))}
        </ul>
      </div>

      {/* Limitations */}
      {record.limitations.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Limitations</div>
          <ul style={{ paddingLeft: 16 }}>
            {record.limitations.map((l, i) => (
              <li key={i} style={{ fontSize: '0.75rem', color: 'var(--clr-warning)', marginBottom: 3 }}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Decision delta */}
      <div className="card-inset" style={{ padding: 10 }}>
        <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Decision Delta</div>
        <pre style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
          {JSON.stringify(record.decision_delta, null, 2)}
        </pre>
      </div>

      {/* Export */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => exportEvidence(record)}
      >
        <Download size={14} /> Export Evidence JSON
      </button>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Export includes a file-integrity checksum (not a digital signature).
      </div>
    </div>
  );
}

export default function EvidencePage() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['evidence-all'],
    queryFn: fetchAllEvidence,
  });

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EvidenceRecord | null>(null);

  const filtered = records.filter(r =>
    !search ||
    r.incident_id.toLowerCase().includes(search.toLowerCase()) ||
    r.data_source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Evidence Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
          Auditable anomaly evidence records with provenance and export · Synthetic demo data
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              className="input"
              style={{ paddingLeft: 30 }}
              placeholder="Search incident or source…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search evidence records"
            />
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} />)
          ) : filtered.length === 0 ? (
            <EmptyState title="No evidence records" description="Records appear when incidents are flagged." icon={<FileCheck />} />
          ) : (
            filtered.map(r => (
              <div
                key={`${r.incident_id}-${r.created_at}`}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: selected?.incident_id === r.incident_id ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '12px 14px',
                  transition: 'all 0.15s',
                }}
                onClick={() => setSelected(r)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelected(r)}
                role="button"
                aria-label={`View evidence for ${r.incident_id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Shield size={13} color="var(--accent)" />
                  <code style={{ fontSize: '0.82rem', color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 700 }}>
                    {r.incident_id}
                  </code>
                  {r.scenario_id && <span className="sim-banner" style={{ padding: '1px 5px', fontSize: '0.62rem' }}>SIM</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 3 }}>{r.data_source}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {format(new Date(r.created_at), 'MMM d, HH:mm')} · {r.detector.name} v{r.detector.version}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.sensor_ids.map(id => (
                    <code key={id} style={{ fontSize: '0.7rem', background: 'var(--surface-inset)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{id}</code>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <Card>
              <SectionHeader
                title={`Evidence: ${selected.incident_id}`}
                subtitle={`Created ${format(new Date(selected.created_at), 'PPP')}`}
                actions={
                  <button className="btn btn-ghost" style={{ fontSize: '0.72rem' }} onClick={() => setSelected(null)}>Close</button>
                }
              />
              <EvidenceDetailView record={selected} />
            </Card>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-secondary)', textAlign: 'center' }}>
              <FileCheck size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h4>Select an evidence record</h4>
              <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Click a record from the list to view details and export JSON</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
