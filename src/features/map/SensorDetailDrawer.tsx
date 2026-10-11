import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchTimeSeries } from '@/services/api';
import { Drawer, StatusBadge, FreshnessBadge, AnomalyScore, ConfidenceBar, ProvenanceLabel, Skeleton } from '@/components/ui';
import type { SensorSummary } from '@/types';
import { MapPin, AlertTriangle, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props { sensor: SensorSummary | null; onClose: () => void; }

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{children}</span>
    </div>
  );
}

export function SensorDetailDrawer({ sensor, onClose }: Props) {
  const { data: tsData = [], isLoading: tsLoading } = useQuery({
    queryKey: ['timeseries', sensor?.sensor_id, 'PM25'],
    queryFn: () => fetchTimeSeries(sensor!.sensor_id, 'PM25', 24),
    enabled: sensor != null,
  });

  if (!sensor) return null;

  const pm25 = sensor.latest_measurements?.PM25;
  const pm10 = sensor.latest_measurements?.PM10;
  const chartData = tsData.slice(-24).map((d, i) => ({
    t: i % 4 === 0 ? new Date(d.timestamp).getHours() + ':00' : '',
    pm25: d.value,
  }));

  return (
    <Drawer open title={`Sensor: ${sensor.name ?? sensor.sensor_id}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Provenance + status */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ProvenanceLabel provenance={sensor.provenance} isSimulated={sensor.is_simulated} />
          <StatusBadge status={sensor.integrity_status} />
          <FreshnessBadge freshness={sensor.data_freshness} />
        </div>

        {/* Identity */}
        <div className="card-inset" style={{ padding: 12 }}>
          <DetailRow label="Sensor ID"><code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{sensor.sensor_id}</code></DetailRow>
          <DetailRow label="Source">{sensor.source ?? '—'}</DetailRow>
          <DetailRow label="Coordinates">
            {sensor.latitude != null && sensor.longitude != null
              ? `${sensor.latitude.toFixed(4)}, ${sensor.longitude.toFixed(4)}`
              : 'No coordinates'}
          </DetailRow>
          <DetailRow label="Last seen">
            {sensor.last_seen ? formatDistanceToNow(new Date(sensor.last_seen), { addSuffix: true }) : '—'}
          </DetailRow>
        </div>

        {/* Measurements */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Latest Measurements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'PM2.5', data: pm25, threshold: 55, color: pm25?.value != null && pm25.value > 55 ? 'var(--clr-warning)' : 'var(--clr-normal)' },
              { label: 'PM10', data: pm10, threshold: 100, color: pm10?.value != null && pm10.value > 100 ? 'var(--clr-warning)' : 'var(--clr-normal)' },
            ].map(({ label, data, color }) => (
              <div key={label} className="card-inset" style={{ padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                {data != null ? (
                  <>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color, fontFamily: 'monospace' }}>{data.value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{data.unit}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>—</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly info */}
        {sensor.integrity_status !== 'normal' && (
          <div className="card-inset" style={{ padding: 12, border: '1px solid color-mix(in srgb, var(--clr-warning) 40%, transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={14} color="var(--clr-warning)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-warning)' }}>Anomaly Detected</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <ConfidenceBar value={sensor.anomaly_score ?? 0} label="Anomaly Score" />
            </div>
            {sensor.reasons.length > 0 && (
              <ul style={{ paddingLeft: 16 }}>
                {sensor.reasons.map((r, i) => (
                  <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 3 }}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Anomaly score pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Anomaly score</span>
          <AnomalyScore score={sensor.anomaly_score} />
        </div>

        {/* Historical trend */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            PM2.5 History (24h) — Synthetic
          </div>
          {tsLoading ? (
            <Skeleton height={140} />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="pm25" stroke="var(--accent)" dot={false} strokeWidth={2} name="PM2.5" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Location info */}
        {sensor.latitude != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <MapPin size={13} />
            <span>lat {sensor.latitude.toFixed(5)}, lng {sensor.longitude?.toFixed(5)}</span>
          </div>
        )}

        {/* Data quality note */}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', lineHeight: 1.5 }}>
          <strong>Note:</strong> All measurements shown are synthetic demo data. Anomaly flags reflect detector heuristics and require field verification before acting.
        </div>
      </div>
    </Drawer>
  );
}
