import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  RadioTower, ShieldAlert, AlertTriangle, Clock, TrendingUp,
  Activity, MapPin, FileCheck, RefreshCw,
} from 'lucide-react';
import { fetchKpi, fetchIncidents, fetchDashboardSeries, fetchSensors } from '@/services/api';
import { Skeleton, SeverityBadge, StatusBadge, Card, SectionHeader, EmptyState } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import type { IntegrityStatus } from '@/types';

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, onClick, subtitle }: {
  label: string; value: number | string; icon: React.FC<{ size?: number; color?: string }>;
  color?: string; onClick?: () => void; subtitle?: string;
}) {
  return (
    <div
      className="card"
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={`${label}: ${value}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--r-sm)',
          background: color ? `color-mix(in srgb, ${color} 15%, transparent)` : 'var(--accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-inset)',
        }}>
          <Icon size={18} color={color ?? 'var(--accent)'} />
        </div>
        <TrendingUp size={14} color="var(--text-secondary)" />
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
        {subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2, opacity: 0.7 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Integrity distribution ────────────────────────────────────────────────────
const INTEGRITY_COLORS: Record<IntegrityStatus, string> = {
  normal:            '#23865B',
  suspicious:        '#C84949',
  under_review:      '#C58A23',
  insufficient_data: '#788598',
};

export default function DashboardPage() {
  const nav = useNavigate();
  const { data: kpi, isLoading: kpiLoading } = useQuery({ queryKey: ['kpi'], queryFn: fetchKpi });
  const { data: incidents = [], isLoading: incLoading } = useQuery({ queryKey: ['incidents'], queryFn: fetchIncidents });
  const { data: series = [], isLoading: seriesLoading } = useQuery({ queryKey: ['dashboard-series'], queryFn: fetchDashboardSeries });
  const { data: sensors = [] } = useQuery({ queryKey: ['sensors'], queryFn: fetchSensors });

  // Integrity distribution for pie chart
  const integrityDist = React.useMemo(() => {
    const counts: Record<IntegrityStatus, number> = {
      normal: 0, suspicious: 0, under_review: 0, insufficient_data: 0,
    };
    sensors.forEach(s => { counts[s.integrity_status] = (counts[s.integrity_status] ?? 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        name: k.replace(/_/g, ' '),
        value: v,
        color: INTEGRITY_COLORS[k as IntegrityStatus],
      }));
  }, [sensors]);

  const activeIncidents = incidents.filter(i => ['open', 'investigating'].includes(i.status));

  // Chart data (last 24 points for clarity)
  const chartData = series.slice(-24);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Security Overview
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
              Environmental sensor integrity monitoring · Synthetic demo data
            </p>
          </div>
          <span className="sim-banner" role="status" aria-live="polite">
            ⚗ SYNTHETIC DATA — NOT OFFICIAL MEASUREMENTS
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={120} />)
        ) : (
          <>
            <KpiCard
              label="Monitored Stations"
              value={kpi?.total_sensors ?? 0}
              icon={RadioTower}
              onClick={() => nav('/sensors')}
            />
            <KpiCard
              label="Reporting (Fresh)"
              value={kpi?.reporting_sensors ?? 0}
              icon={Activity}
              color="var(--clr-normal)"
              onClick={() => nav('/sensors?freshness=fresh')}
            />
            <KpiCard
              label="Flagged Anomalies"
              value={kpi?.flagged_anomalies ?? 0}
              icon={ShieldAlert}
              color="var(--clr-critical)"
              onClick={() => nav('/incidents')}
              subtitle="Open or investigating"
            />
            <KpiCard
              label="Stale / No Data"
              value={kpi?.stale_measurements ?? 0}
              icon={Clock}
              color="var(--clr-warning)"
              onClick={() => nav('/sensors?freshness=stale')}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Measurement trends */}
        <Card>
          <SectionHeader
            title="PM2.5 & PM10 Trends (48h)"
            subtitle="Synthetic measurements — clearly labeled"
            actions={<RefreshCw size={14} color="var(--text-secondary)" />}
          />
          {seriesLoading ? <Skeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="pm25grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pm10grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C58A23" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C58A23" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="timestamp" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} interval={3} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="pm25" stroke="var(--accent)" fill="url(#pm25grad)" strokeWidth={2} name="PM2.5 µg/m³" />
                <Area type="monotone" dataKey="pm10" stroke="#C58A23" fill="url(#pm10grad)" strokeWidth={2} name="PM10 µg/m³" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Integrity distribution */}
        <Card>
          <SectionHeader title="Sensor Integrity" subtitle={`${sensors.length} stations`} />
          {sensors.length === 0 ? <Skeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={integrityDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {integrityDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10 }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent incidents */}
        <Card>
          <SectionHeader
            title="Recent Incidents"
            subtitle="Open and investigating"
            actions={
              <button className="btn btn-ghost" onClick={() => nav('/incidents')} style={{ fontSize: '0.75rem' }}>
                View all
              </button>
            }
          />
          {incLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={60} style={{ marginBottom: 8 }} />)
          ) : activeIncidents.length === 0 ? (
            <EmptyState title="No active incidents" description="All incidents are resolved or closed." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeIncidents.slice(0, 5).map(inc => (
                <div
                  key={inc.incident_id}
                  className="card-inset"
                  style={{ cursor: 'pointer', padding: '10px 12px' }}
                  onClick={() => nav('/incidents')}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/incidents')}
                  role="button"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent)' }}>
                      {inc.incident_id}
                    </span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {inc.summary.slice(0, 100)}{inc.summary.length > 100 ? '…' : ''}
                  </p>
                  <div style={{ marginTop: 4, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                    {inc.is_simulated && <span className="sim-banner" style={{ marginLeft: 8, padding: '1px 6px', fontSize: '0.65rem' }}>SIM</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sensor health summary */}
        <Card>
          <SectionHeader
            title="Sensor Health Summary"
            actions={
              <button className="btn btn-ghost" onClick={() => nav('/sensors')} style={{ fontSize: '0.75rem' }}>
                Registry
              </button>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sensors.slice(0, 6).map(s => (
              <div
                key={s.sensor_id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}
                onClick={() => nav('/sensors')}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && nav('/sensors')}
                role="button"
              >
                <MapPin size={13} color="var(--text-secondary)" />
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>{s.name ?? s.sensor_id}</span>
                <StatusBadge status={s.integrity_status} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {s.latest_measurements?.PM25?.value != null ? `${s.latest_measurements.PM25.value} µg/m³` : '—'}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="var(--accent)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
              {sensors.filter(s => s.integrity_status !== 'normal').length} of {sensors.length} sensors flagged or under review
            </span>
            <FileCheck size={12} color="var(--accent)" style={{ marginLeft: 'auto' }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
