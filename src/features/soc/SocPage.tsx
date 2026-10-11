import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSocStatus, fetchIncidents } from '@/services/api';
import { Card, SectionHeader, Skeleton, SeverityBadge } from '@/components/ui';
import { ShieldCheck, Wifi, WifiOff, AlertTriangle, Clock, Activity, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SocPage() {
  const { data: socStatus, isLoading: socLoading } = useQuery({
    queryKey: ['soc-status'],
    queryFn: fetchSocStatus,
  });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: fetchIncidents });

  const openIncidents = incidents.filter(i => ['open', 'investigating'].includes(i.status));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>SOC Integration</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
          Security Operations Center integration status and event bridge
        </p>
      </div>

      {/* Connection status banner */}
      <div style={{ marginBottom: 20 }}>
        {socLoading ? (
          <Skeleton height={80} />
        ) : (
          <div className="card" style={{
            borderLeft: `4px solid ${socStatus?.connected ? 'var(--clr-normal)' : 'var(--clr-unknown)'}`,
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {socStatus?.connected ? (
                <Wifi size={24} color="var(--clr-normal)" />
              ) : (
                <WifiOff size={24} color="var(--clr-unknown)" />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                  SOC Backend: {socStatus?.connected ? 'Connected' : 'Not Connected'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {socStatus?.message}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {socStatus?.connected ? (
                  <span className="badge badge-normal">ONLINE</span>
                ) : (
                  <span className="badge badge-unknown">OFFLINE</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Backend Version',
            value: socStatus?.backend_version ?? 'N/A',
            icon: Activity,
            color: 'var(--clr-unknown)',
          },
          {
            label: 'Last Heartbeat',
            value: socStatus?.last_heartbeat
              ? formatDistanceToNow(new Date(socStatus.last_heartbeat), { addSuffix: true })
              : 'Never',
            icon: Clock,
            color: 'var(--clr-unknown)',
          },
          {
            label: 'Unreviewed Events',
            value: socStatus?.unreviewed_count ?? 0,
            icon: AlertTriangle,
            color: 'var(--clr-warning)',
          },
          {
            label: 'ML Model',
            value: socStatus?.model_available ? 'Available' : 'Unavailable',
            icon: ShieldCheck,
            color: socStatus?.model_available ? 'var(--clr-normal)' : 'var(--clr-unknown)',
          },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `color-mix(in srgb, ${item.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={item.color} />
                </div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pending incidents for SOC review */}
        <Card>
          <SectionHeader title="Pending SOC Review" subtitle={`${openIncidents.length} open incidents`} />
          {openIncidents.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              No open incidents awaiting review
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {openIncidents.slice(0, 5).map(inc => (
                <div key={inc.incident_id} style={{ padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <code style={{ fontSize: '0.78rem', color: 'var(--accent)', fontFamily: 'monospace' }}>{inc.incident_id}</code>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>{inc.type.replace(/_/g, ' ')}</div>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Integration configuration */}
        <Card>
          <SectionHeader title="Integration Configuration" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'SIEM Adapter', value: 'Not configured', status: 'unknown' },
              { label: 'Event Schema', value: 'TerraCare v1.0', status: 'normal' },
              { label: 'Auth Method', value: 'API key (backend only)', status: 'normal' },
              { label: 'Webhook URL', value: 'Not set', status: 'unknown' },
              { label: 'Alert Forwarding', value: 'Disabled', status: 'unknown' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: row.status === 'normal' ? 'var(--clr-normal)' : 'var(--clr-unknown)' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Backend configuration is required for live integration. No credentials are stored in this frontend.
          </div>
        </Card>
      </div>

      {/* Integration guidance */}
      <div className="card-inset" style={{ padding: 14, marginTop: 16, display: 'flex', gap: 10 }}>
        <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>To enable SOC integration:</strong> Configure a compatible SIEM adapter on the backend and set the TerraCare SOC endpoint.
          The frontend will reflect the actual connection state. No credentials or model configuration are stored here.
          All consequential operations (isolation, blocking, response actions) require explicit analyst authorization from the backend.
        </div>
      </div>
    </div>
  );
}
