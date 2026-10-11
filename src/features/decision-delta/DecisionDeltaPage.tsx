import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchAqiComparison } from '@/services/api';
import { Card, SectionHeader, Skeleton, ConfidenceBar } from '@/components/ui';
import { AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';

function AqiGauge({ aqi, label, category, color }: { aqi: number; label: string; category: string; color: string }) {
  const pct = Math.min(100, (aqi / 300) * 100);
  return (
    <div className="card-inset" style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '3rem', fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>{aqi}</div>
      <div style={{ fontSize: '0.75rem', color, fontWeight: 600, marginTop: 4, marginBottom: 10 }}>{category}</div>
      <div style={{ height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

const AQI_BREAKPOINTS = [
  { range: '0–50', category: 'Good', color: '#23865B', pollutant: 'PM2.5 0–12.0 µg/m³' },
  { range: '51–100', category: 'Moderate', color: '#C5A023', pollutant: 'PM2.5 12.1–35.4 µg/m³' },
  { range: '101–150', category: 'Unhealthy (Sensitive)', color: '#C58A23', pollutant: 'PM2.5 35.5–55.4 µg/m³' },
  { range: '151–200', category: 'Unhealthy', color: '#C84949', pollutant: 'PM2.5 55.5–150.4 µg/m³' },
  { range: '201–300', category: 'Very Unhealthy', color: '#8B2FC9', pollutant: 'PM2.5 150.5–250.4 µg/m³' },
];

const POLLUTANT_DATA = [
  { name: 'PM2.5', official: 68.4, integrity: 79.2, unit: 'µg/m³' },
  { name: 'PM10', official: 112.8, integrity: 132.5, unit: 'µg/m³' },
  { name: 'NO₂', official: 41.2, integrity: 41.2, unit: 'ppb' },
];

export default function DecisionDeltaPage() {
  const { data: aqi, isLoading } = useQuery({
    queryKey: ['aqi-compare'],
    queryFn: fetchAqiComparison,
  });

  const delta = aqi ? aqi.integrity_aware_aqi - aqi.official_aqi : 0;
  const deltaColor = delta > 0 ? 'var(--clr-critical)' : delta < 0 ? 'var(--clr-normal)' : 'var(--text-secondary)';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Decision Delta</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
          How flagged sensor anomalies affect downstream environmental interpretation · Synthetic estimates only
        </p>
      </div>

      {/* Main AQI comparison */}
      {isLoading ? (
        <Skeleton height={180} style={{ marginBottom: 16 }} />
      ) : aqi ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <AqiGauge
              aqi={aqi.official_aqi}
              label="Official / Source-Reported AQI"
              category={aqi.official_category}
              color="var(--clr-warning)"
            />
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Delta</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: deltaColor, fontFamily: 'monospace' }}>
                {delta > 0 ? '+' : ''}{delta}
              </div>
              {delta !== 0 && (delta > 0 ? <TrendingUp size={20} color={deltaColor} /> : <TrendingDown size={20} color={deltaColor} />)}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>AQI points</div>
            </div>
            <AqiGauge
              aqi={aqi.integrity_aware_aqi}
              label="Integrity-Aware Estimate"
              category={aqi.integrity_aware_category}
              color="var(--clr-critical)"
            />
          </div>

          {/* Flagged sensor summary */}
          <div className="card-inset" style={{ padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderLeft: '3px solid var(--clr-warning)' }}>
            <AlertTriangle size={16} color="var(--clr-warning)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              <strong>{aqi.flagged_sensor_count}</strong> of {aqi.total_sensor_count} sensors are flagged. Integrity-aware estimate excludes or downweights these sensors.
            </span>
          </div>

          {/* Confidence */}
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <ConfidenceBar value={aqi.confidence} label={`Estimate confidence (${Math.round(aqi.confidence * 100)}% — based on ${aqi.total_sensor_count - aqi.flagged_sensor_count} unflagged sensors)`} />
          </div>

          {/* Notes */}
          <Card style={{ marginBottom: 20 }}>
            <SectionHeader title="Methodology Notes" />
            <ul style={{ paddingLeft: 16 }}>
              {aqi.notes.map((note, i) => (
                <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{note}</li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}

      {/* Pollutant comparison chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card>
          <SectionHeader title="Pollutant Concentration Comparison" subtitle="Official vs. integrity-aware estimate" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={POLLUTANT_DATA} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="official" name="Official" fill="var(--clr-warning)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="integrity" name="Integrity-aware" fill="var(--clr-critical)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* AQI breakpoints reference */}
        <Card>
          <SectionHeader title="US EPA AQI Categories" subtitle="PM2.5 breakpoints (reference)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AQI_BREAKPOINTS.map(bp => (
              <div key={bp.range} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 'var(--r-sm)', background: 'var(--surface-inset)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: bp.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.78rem', width: 70 }}>{bp.range}</span>
                <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{bp.category}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{bp.pollutant.split('µg')[0]}µg</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="card-inset" style={{ padding: 14, display: 'flex', gap: 10 }}>
        <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Disclaimer:</strong> All AQI values shown are synthetic estimates calculated from demo sensor data.
          They are not official air quality determinations and must not be used for public health advisories, regulatory compliance, or operational decisions.
          AQI calculation uses US EPA NowCast methodology for PM2.5 concentration breakpoints.
        </div>
      </div>
    </div>
  );
}
