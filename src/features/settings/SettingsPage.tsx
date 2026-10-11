import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card, SectionHeader } from '@/components/ui';
import { Sun, Moon, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const APP_VERSION = '1.0.0-demo';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [defaultRegion, setDefaultRegion] = useState('metro-a');
  const [defaultPollutant, setDefaultPollutant] = useState('PM25');
  const [defaultTimeRange, setDefaultTimeRange] = useState('24h');
  const [simMode, setSimMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app this would persist to a backend. Here we just acknowledge.
    setSaved(true);
    toast.success('Preferences noted (session only — no persistence backend configured)');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
          Interface preferences and configuration status
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Appearance */}
        <Card>
          <SectionHeader title="Appearance" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Theme
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  className={`btn ${theme === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => theme !== t && toggleTheme()}
                  aria-pressed={theme === t}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {t === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                  {t === 'light' ? 'Light' : 'Dark'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Default preferences */}
        <Card>
          <SectionHeader title="Default View" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Default Region', value: defaultRegion, setter: setDefaultRegion, options: [['metro-a', 'Metro Region A'], ['metro-b', 'Metro Region B'], ['suburb-n', 'North Suburbs']] },
              { label: 'Default Pollutant', value: defaultPollutant, setter: setDefaultPollutant, options: [['PM25', 'PM2.5'], ['PM10', 'PM10'], ['NO2', 'NO₂'], ['O3', 'O₃']] },
              { label: 'Default Time Range', value: defaultTimeRange, setter: setDefaultTimeRange, options: [['1h', '1 hour'], ['6h', '6 hours'], ['24h', '24 hours'], ['7d', '7 days']] },
            ].map(({ label, value, setter, options }) => (
              <div key={label}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
                <select className="input" value={value} onChange={e => setter(e.target.value)} aria-label={label}>
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Card>

        {/* Mode config */}
        <Card>
          <SectionHeader title="Operation Mode" />
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Simulation Mode</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Enable Scenario Lab controls
                </div>
              </div>
              <button
                className={`btn ${simMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setSimMode(s => !s); toast(simMode ? 'Simulation mode disabled' : '⚗ Simulation mode enabled — data changes are local only'); }}
                aria-pressed={simMode}
                style={{ padding: '6px 14px' }}
              >
                {simMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            {simMode && (
              <div className="sim-banner" style={{ display: 'flex' }}>
                ⚗ Simulation controls are active — no real data will be modified
              </div>
            )}
          </div>
        </Card>

        {/* API health */}
        <Card>
          <SectionHeader title="Data Source Health" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'EcoNet Alpha', status: 'Synthetic fixture', ok: true },
              { name: 'EcoNet Beta', status: 'Synthetic fixture', ok: true },
              { name: 'SOC Backend', status: 'Not configured', ok: false },
              { name: 'Live AQI API', status: 'Not connected', ok: false },
            ].map(row => (
              <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{row.name}</span>
                <span style={{ fontSize: '0.75rem', color: row.ok ? 'var(--clr-normal)' : 'var(--text-secondary)' }}>
                  {row.ok && <CheckCircle size={12} style={{ marginRight: 4, display: 'inline' }} />}
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-ghost" onClick={() => toast('Changes discarded')}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? <><CheckCircle size={14} /> Saved</> : 'Save Preferences'}
        </button>
      </div>

      {/* App info */}
      <div className="card-inset" style={{ marginTop: 16, padding: 14, display: 'flex', gap: 10 }}>
        <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 4 }}><strong>EcoTruth</strong> v{APP_VERSION} — Environmental Data Integrity Platform</div>
          <div>Settings are stored in <code>localStorage</code> only and are not persisted to a backend.
          No API keys or credentials are stored in this frontend. All sensor data shown is synthetic.</div>
        </div>
      </div>
    </div>
  );
}
