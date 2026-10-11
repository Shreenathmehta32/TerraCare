import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchSensors } from '@/services/api';
import { StatusBadge, FreshnessBadge, AnomalyScore, Skeleton, EmptyState } from '@/components/ui';
import { SensorDetailDrawer } from '@/features/map/SensorDetailDrawer';
import type { SensorSummary, DataFreshness, IntegrityStatus } from '@/types';
import { Search, MapPin, ChevronUp, ChevronDown, RadioTower } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 10;

type SortKey = keyof Pick<SensorSummary, 'sensor_id' | 'integrity_status' | 'data_freshness' | 'anomaly_score'>;

export default function SensorsPage() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState<IntegrityStatus | 'all'>('all');
  const [freshnessFilter, setFreshnessFilter] = useState<DataFreshness | 'all'>(
    (searchParams.get('freshness') as DataFreshness | null) ?? 'all'
  );
  const [sortKey, setSortKey] = useState<SortKey>('sensor_id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedSensor, setSelectedSensor] = useState<SensorSummary | null>(null);

  const { data: sensors = [], isLoading } = useQuery({
    queryKey: ['sensors'],
    queryFn: fetchSensors,
  });

  const filtered = useMemo(() => {
    let list = [...sensors];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.sensor_id.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.source?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(s => s.integrity_status === statusFilter);
    if (freshnessFilter !== 'all') list = list.filter(s => s.data_freshness === freshnessFilter);

    list.sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [sensors, search, statusFilter, freshnessFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Sensor Registry</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
          {sensors.length} synthetic sensors · Click to inspect
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search sensor ID, name, source…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search sensors"
          />
        </div>

        <select
          className="input"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as IntegrityStatus | 'all'); setPage(1); }}
          aria-label="Filter by integrity status"
        >
          <option value="all">All statuses</option>
          <option value="normal">Normal</option>
          <option value="suspicious">Suspicious</option>
          <option value="under_review">Under Review</option>
          <option value="insufficient_data">Insufficient Data</option>
        </select>

        <select
          className="input"
          style={{ width: 'auto' }}
          value={freshnessFilter}
          onChange={e => { setFreshnessFilter(e.target.value as DataFreshness | 'all'); setPage(1); }}
          aria-label="Filter by data freshness"
        >
          <option value="all">All freshness</option>
          <option value="fresh">Fresh</option>
          <option value="stale">Stale</option>
          <option value="unavailable">No Data</option>
        </select>

        <button
          className="btn btn-ghost"
          onClick={() => { setSearch(''); setStatusFilter('all'); setFreshnessFilter('all'); setPage(1); }}
        >
          Reset filters
        </button>

        {/* Active filter chips */}
        {(search || statusFilter !== 'all' || freshnessFilter !== 'all') && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <span>{filtered.length} results</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} role="table" aria-label="Sensor registry">
            <thead>
              <tr style={{ background: 'var(--surface-inset)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'sensor_id', label: 'Sensor ID' },
                  { key: null, label: 'Name / Location' },
                  { key: 'integrity_status', label: 'Integrity' },
                  { key: 'data_freshness', label: 'Freshness' },
                  { key: null, label: 'PM2.5' },
                  { key: null, label: 'PM10' },
                  { key: null, label: 'Last Seen' },
                  { key: 'anomaly_score', label: 'Score' },
                  { key: null, label: 'Actions' },
                ].map(col => (
                  <th
                    key={col.label}
                    style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem',
                      fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em',
                      textTransform: 'uppercase', cursor: col.key ? 'pointer' : 'default',
                      userSelect: 'none', whiteSpace: 'nowrap',
                    }}
                    onClick={() => col.key && handleSort(col.key as SortKey)}
                    scope="col"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.key && <SortIcon k={col.key as SortKey} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} style={{ padding: '8px 14px' }}>
                      <Skeleton height={28} />
                    </td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No sensors found" description="Try adjusting your filters." icon={<RadioTower />} />
                  </td>
                </tr>
              ) : (
                paged.map(sensor => {
                  const pm25 = sensor.latest_measurements?.PM25?.value;
                  const pm10 = sensor.latest_measurements?.PM10?.value;
                  const rowBg = sensor.integrity_status === 'suspicious'
                    ? 'color-mix(in srgb, var(--clr-critical) 4%, transparent)'
                    : 'transparent';
                  return (
                    <tr
                      key={sensor.sensor_id}
                      style={{ borderBottom: '1px solid var(--border)', background: rowBg, cursor: 'pointer', transition: 'background 0.1s' }}
                      onClick={() => setSelectedSensor(sensor)}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setSelectedSensor(sensor)}
                      role="row"
                    >
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                        {sensor.sensor_id}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem', fontWeight: 500 }}>
                        {sensor.name ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={sensor.integrity_status} />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <FreshnessBadge freshness={sensor.data_freshness} />
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {pm25 != null ? `${pm25} µg/m³` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {pm10 != null ? `${pm10} µg/m³` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {sensor.last_seen
                          ? formatDistanceToNow(new Date(sensor.last_seen), { addSuffix: true })
                          : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <AnomalyScore score={sensor.anomaly_score} />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                            onClick={e => { e.stopPropagation(); setSelectedSensor(sensor); }}
                            aria-label={`Inspect ${sensor.sensor_id}`}
                          >
                            Inspect
                          </button>
                          {sensor.latitude != null && (
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                              onClick={e => { e.stopPropagation(); nav('/map'); }}
                              aria-label={`View ${sensor.sensor_id} on map`}
                            >
                              <MapPin size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface-inset)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages} · {filtered.length} sensors
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      <SensorDetailDrawer sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
    </div>
  );
}
