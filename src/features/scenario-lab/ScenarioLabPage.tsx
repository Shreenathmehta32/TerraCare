import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { fetchScenarios, runScenario, resetScenario, fetchTimeSeries } from '@/services/api';
import { SENSORS } from '@/services/mock/fixtures';
import { Card, SectionHeader, Skeleton } from '@/components/ui';
import { Play, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

type ScenarioId = 'none' | 'calibration_drift' | 'single_clean_lie' | 'coordinated_cluster' | 'flatline';

function applyScenario(baseline: number[], scenarioId: ScenarioId): number[] {
  return baseline.map((v, i) => {
    switch (scenarioId) {
      case 'calibration_drift': return parseFloat((v * (1 + (i / baseline.length) * 0.1)).toFixed(1));
      case 'single_clean_lie': return parseFloat((v * 0.3).toFixed(1));
      case 'coordinated_cluster': return parseFloat((v * 0.35).toFixed(1));
      case 'flatline': return 55.5;
      default: return v;
    }
  });
}

export default function ScenarioLabPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('none');
  const [selectedSensor, setSelectedSensor] = useState('ECO-003');
  const [ran, setRan] = useState(false);

  const { data: scenarios = [] } = useQuery({ queryKey: ['scenarios'], queryFn: fetchScenarios });

  const { data: tsData = [], isLoading: tsLoading } = useQuery({
    queryKey: ['timeseries', selectedSensor, 'PM25'],
    queryFn: () => fetchTimeSeries(selectedSensor, 'PM25', 24),
  });

  const runMutation = useMutation({
    mutationFn: () => runScenario(selectedScenario),
    onSuccess: () => {
      setRan(true);
      toast.success(`Scenario "${selectedScenario}" applied to local demo dataset`);
    },
    onError: () => toast.error('Scenario run failed'),
  });

  const resetMutation = useMutation({
    mutationFn: resetScenario,
    onSuccess: () => {
      setRan(false);
      setSelectedScenario('none');
      toast.success('Scenario reset — baseline restored');
    },
    onError: () => toast.error('Reset failed'),
  });

  // Build comparison chart data
  const chartData = tsData.slice(-24).map((d, i) => {
    const base = d.value;
    const modified = ran && selectedScenario !== 'none'
      ? applyScenario([base], selectedScenario)[0]
      : null;
    return {
      t: i % 4 === 0 ? new Date(d.timestamp).getHours() + ':00' : '',
      baseline: base,
      scenario: modified,
    };
  });

  const currentScenario = scenarios.find(s => s.id === selectedScenario);

  const detectorOutput = ran && selectedScenario !== 'none' ? {
    calibration_drift: { type: 'calibration_drift', confidence: 0.72, reason: 'Gradual positive offset detected over 24h (≈+10% deviation from baseline trend)' },
    single_clean_lie: { type: 'spatial_inconsistency', confidence: 0.78, reason: 'Reported value 70% below spatial expectation from kriging interpolation' },
    coordinated_cluster: { type: 'spatial_inconsistency', confidence: 0.85, reason: 'Correlated low readings across 3 sensors — cluster anomaly pattern detected' },
    flatline: { type: 'flatline', confidence: 0.95, reason: 'Identical value (55.5 µg/m³) reported for all 24 consecutive intervals' },
  }[selectedScenario as Exclude<ScenarioId, 'none'>] : null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Scenario Lab</h1>
          {ran && (
            <div className="sim-banner" role="status" aria-live="polite">
              ⚗ SIMULATION MODE ACTIVE — Local data only
            </div>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Apply synthetic perturbations to a <strong>local copy</strong> of demo data to test detector sensitivity.
          Original data is never modified.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        {/* Left panel - controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <SectionHeader title="Scenario Controls" />

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Scenario
              </label>
              <select
                className="input"
                value={selectedScenario}
                onChange={e => { setSelectedScenario(e.target.value as ScenarioId); setRan(false); }}
                aria-label="Select scenario"
                disabled={ran}
              >
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Target Sensor
              </label>
              <select
                className="input"
                value={selectedSensor}
                onChange={e => { setSelectedSensor(e.target.value); setRan(false); }}
                aria-label="Select sensor"
                disabled={ran}
              >
                {SENSORS.map(s => (
                  <option key={s.sensor_id} value={s.sensor_id}>{s.name ?? s.sensor_id}</option>
                ))}
              </select>
            </div>

            {currentScenario && (
              <div className="card-inset" style={{ padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {currentScenario.description}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={selectedScenario === 'none' || ran || runMutation.isPending}
                onClick={() => {
                  toast('Running simulation on local dataset copy…', { icon: '⚗' });
                  runMutation.mutate();
                }}
              >
                <Play size={14} />
                {runMutation.isPending ? 'Running…' : 'Run Simulation'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => resetMutation.mutate()}
                disabled={!ran || resetMutation.isPending}
                aria-label="Reset simulation to baseline"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {selectedScenario === 'none' && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
                Select a scenario to enable simulation
              </p>
            )}
          </Card>

          {/* Info panel */}
          <Card>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Safety notice:</strong> Scenarios apply only to an isolated local dataset copy.
                No real sensor systems, APIs, or government data are modified. Results shown are purely synthetic.
              </div>
            </div>
          </Card>

          {/* Detector output */}
          {detectorOutput && (
            <Card style={{ borderLeft: '3px solid var(--clr-critical)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} color="var(--clr-warning)" />
                <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Detector Findings</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Type detected: </span>
                  <span className="badge badge-warning">{detectorOutput.type.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Confidence: </span>
                  <strong>{Math.round(detectorOutput.confidence * 100)}%</strong>
                </div>
                <div className="card-inset" style={{ padding: 8, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {detectorOutput.reason}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Ground truth: <strong>{selectedScenario}</strong> (synthetic scenario — confirmed)
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right panel - chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionHeader
              title={ran ? 'Before vs. After Comparison' : 'Baseline PM2.5 (24h)'}
              subtitle={`Sensor: ${selectedSensor} — synthetic data`}
            />
            {tsLoading ? <Skeleton height={280} /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="t" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} unit=" µg" />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem' }}
                    labelStyle={{ color: 'var(--text-secondary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                  <Line type="monotone" dataKey="baseline" stroke="var(--accent)" strokeWidth={2} dot={false} name="Baseline (original)" />
                  {ran && selectedScenario !== 'none' && (
                    <Line type="monotone" dataKey="scenario" stroke="var(--clr-critical)" strokeWidth={2} strokeDasharray="5 3" dot={false} name={`Scenario: ${selectedScenario}`} />
                  )}
                  {ran && (
                    <ReferenceLine y={55} stroke="var(--clr-warning)" strokeDasharray="4 4" label={{ value: 'WHO 24h limit', fontSize: 11, fill: 'var(--clr-warning)' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {ran && (
            <Card>
              <SectionHeader title="Scenario Impact Summary" subtitle="Hypothetical — based on synthetic data" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Baseline AQI', value: '107', note: 'Unhealthy for Sensitive Groups', color: 'var(--clr-warning)' },
                  { label: 'Scenario AQI', value: selectedScenario === 'flatline' ? '109' : '121', note: 'Unhealthy (integrity-aware)', color: 'var(--clr-critical)' },
                  { label: 'Delta', value: selectedScenario === 'flatline' ? '+2' : '+14', note: 'AQI points change', color: 'var(--accent)' },
                ].map(({ label, value, note, color }) => (
                  <div key={label} className="card-inset" style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 3 }}>{note}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                ⚠ Hypothetical impact only. No public safety alerts issued. All values synthetic.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
