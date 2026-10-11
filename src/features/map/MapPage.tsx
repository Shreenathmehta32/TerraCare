import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchSensors } from '@/services/api';
import type { SensorSummary, IntegrityStatus } from '@/types';
import { SensorDetailDrawer } from './SensorDetailDrawer';
import { StatusBadge, FreshnessBadge, Card } from '@/components/ui';
import { MapPin, Layers, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Fix Leaflet default icon path issues in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLORS: Record<IntegrityStatus, string> = {
  normal:            '#23865B',
  suspicious:        '#C84949',
  under_review:      '#C58A23',
  insufficient_data: '#788598',
};

function statusRadius(status: IntegrityStatus): number {
  if (status === 'suspicious') return 14;
  if (status === 'under_review') return 12;
  return 10;
}

type LayerOption = 'pm25' | 'pm10' | 'integrity' | 'freshness';

// Fit-bounds helper component
function FitBounds({ sensors }: { sensors: SensorSummary[] }) {
  const map = useMap();
  React.useEffect(() => {
    const coords = sensors
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => [s.latitude!, s.longitude!] as [number, number]);
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [map, sensors]);
  return null;
}

// Color by layer value
function markerColor(sensor: SensorSummary, layer: LayerOption): string {
  if (layer === 'integrity') return STATUS_COLORS[sensor.integrity_status];
  if (layer === 'freshness') {
    return sensor.data_freshness === 'fresh' ? '#23865B'
      : sensor.data_freshness === 'stale' ? '#C58A23'
      : '#788598';
  }
  const val = layer === 'pm25'
    ? sensor.latest_measurements?.PM25?.value
    : sensor.latest_measurements?.PM10?.value;
  if (val == null) return '#788598';
  if (val > 150) return '#C84949';
  if (val > 100) return '#C58A23';
  if (val > 55)  return '#3867D6';
  return '#23865B';
}

export default function MapPage() {
  const { data: sensors = [], isLoading, error } = useQuery({
    queryKey: ['sensors'],
    queryFn: fetchSensors,
  });

  const [selectedSensor, setSelectedSensor] = useState<SensorSummary | null>(null);
  const [layer, setLayer] = useState<LayerOption>('pm25');
  const [statusFilter, setStatusFilter] = useState<IntegrityStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = sensors.filter(s =>
    statusFilter === 'all' || s.integrity_status === statusFilter
  ).filter(s => s.latitude != null && s.longitude != null);

  const handleMarkerClick = useCallback((sensor: SensorSummary) => {
    setSelectedSensor(sensor);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)', gap: 12 }}>
      {/* Top controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          GIS Intelligence
        </h1>
        <span className="sim-banner">⚗ SYNTHETIC DATA</span>
        <div style={{ flex: 1 }} />

        {/* Layer control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={14} color="var(--text-secondary)" />
          <select
            className="input"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '5px 10px' }}
            value={layer}
            onChange={e => setLayer(e.target.value as LayerOption)}
            aria-label="Select map layer"
          >
            <option value="pm25">PM2.5 concentration</option>
            <option value="pm10">PM10 concentration</option>
            <option value="integrity">Integrity status</option>
            <option value="freshness">Data freshness</option>
          </select>
        </div>

        <button
          className="btn btn-ghost"
          onClick={() => setShowFilters(f => !f)}
          aria-expanded={showFilters}
          aria-label="Toggle filters"
        >
          <Filter size={14} /> Filters
        </button>
        <button className="btn btn-ghost" aria-label="Refresh data">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="card-inset" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Integrity Status:</span>
          {(['all', 'normal', 'suspicious', 'under_review', 'insufficient_data'] as const).map(s => (
            <button
              key={s}
              className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {filtered.length} of {sensors.length} sensors
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, gap: 12, overflow: 'hidden' }}>
        {/* Map */}
        <div style={{ flex: 1, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-raised)', position: 'relative', minHeight: 400 }}>
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1000, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
              borderRadius: 'var(--r-lg)',
            }}>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading sensors…</div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1000, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface)',
            }}>
              <div style={{ textAlign: 'center', color: 'var(--clr-critical)' }}>
                <AlertTriangle size={32} />
                <div style={{ marginTop: 8 }}>Failed to load sensor data</div>
              </div>
            </div>
          )}

          <MapContainer
            center={[28.645, 77.22]}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {!isLoading && filtered.length > 0 && <FitBounds sensors={filtered} />}

            {filtered.map(sensor => {
              const color = markerColor(sensor, layer);
              const radius = statusRadius(sensor.integrity_status);
              const pm25 = sensor.latest_measurements?.PM25?.value;
              const pm10 = sensor.latest_measurements?.PM10?.value;

              return (
                <CircleMarker
                  key={sensor.sensor_id}
                  center={[sensor.latitude!, sensor.longitude!]}
                  radius={radius}
                  pathOptions={{
                    color: '#fff',
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.85,
                  }}
                  eventHandlers={{ click: () => handleMarkerClick(sensor) }}
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                        {sensor.name ?? sensor.sensor_id}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        {sensor.sensor_id} · {sensor.source}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>PM2.5</span>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{pm25 != null ? `${pm25} µg/m³` : '—'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>PM10</span>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{pm10 != null ? `${pm10} µg/m³` : '—'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                        <span>{sensor.integrity_status.replace(/_/g, ' ')}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Last seen</span>
                        <span>{sensor.last_seen ? formatDistanceToNow(new Date(sensor.last_seen), { addSuffix: true }) : '—'}</span>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                        onClick={() => handleMarkerClick(sensor)}
                      >
                        <MapPin size={12} /> Inspect sensor
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 999,
            background: 'var(--surface-raised)', borderRadius: 'var(--r-sm)',
            boxShadow: 'var(--shadow-raised-sm)', padding: '8px 12px',
            fontSize: '0.72rem', border: '1px solid var(--border)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)' }}>
              {layer === 'pm25' ? 'PM2.5 (µg/m³)' : layer === 'pm10' ? 'PM10 (µg/m³)' : layer === 'integrity' ? 'Integrity Status' : 'Data Freshness'}
            </div>
            {layer === 'integrity' ? (
              Object.entries(STATUS_COLORS).map(([k, c]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                </div>
              ))
            ) : (
              [['#23865B', layer === 'freshness' ? 'Fresh' : '< 55'], ['#3867D6', '55–100'], ['#C58A23', '100–150'], ['#C84949', '> 150']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                </div>
              ))
            )}
          </div>

          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </div>

        {/* Side panel - sensor list */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          <Card style={{ padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Sensors ({filtered.length})</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Click sensor or marker to inspect</div>
          </Card>
          {filtered.map(s => (
            <div
              key={s.sensor_id}
              className="card-sm"
              style={{
                cursor: 'pointer',
                borderLeft: `3px solid ${STATUS_COLORS[s.integrity_status]}`,
                padding: '8px 10px',
                background: selectedSensor?.sensor_id === s.sensor_id ? 'var(--accent-soft)' : 'var(--surface-raised)',
                transition: 'all 0.15s',
              }}
              onClick={() => handleMarkerClick(s)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleMarkerClick(s)}
              role="button"
              aria-label={`Inspect ${s.name ?? s.sensor_id}`}
            >
              <div style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 3 }}>{s.name ?? s.sensor_id}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{s.sensor_id}</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <FreshnessBadge freshness={s.data_freshness} />
                {s.integrity_status !== 'normal' && <StatusBadge status={s.integrity_status} />}
              </div>
              {s.latest_measurements?.PM25?.value != null && (
                <div style={{ marginTop: 4, fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  PM2.5: {s.latest_measurements.PM25.value} µg/m³
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <Card style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              No sensors match current filters
            </Card>
          )}
        </div>
      </div>

      {/* Sensor detail drawer */}
      <SensorDetailDrawer
        sensor={selectedSensor}
        onClose={() => setSelectedSensor(null)}
      />
    </div>
  );
}
