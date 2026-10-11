import { subDays, subHours, format } from 'date-fns';
import type {
  SensorSummary,
  Incident,
  EvidenceRecord,
  AqiComparison,
  KpiData,
  SocStatus,
  EnvironmentalMeasurement,
} from '@/types';

// ─── Seeded synthetic sensor data ────────────────────────────────────────────
// Data represents a fictional monitoring grid around a mid-sized South Asian city.
// All values are clearly synthetic and labeled as provenance: 'synthetic'.

const now = new Date();
const iso = (d: Date) => d.toISOString();

export const SENSORS: SensorSummary[] = [
  {
    sensor_id: 'ECO-001', name: 'Sector 4 – North Gate',
    latitude: 28.6445, longitude: 77.2100,
    last_seen: iso(subHours(now, 0.5)),
    latest_measurements: {
      PM25: { value: 62.3, unit: 'µg/m³', timestamp: iso(subHours(now, 0.5)) },
      PM10: { value: 101.1, unit: 'µg/m³', timestamp: iso(subHours(now, 0.5)) },
    },
    data_freshness: 'fresh', integrity_status: 'normal',
    anomaly_score: 0.08, reasons: [], provenance: 'synthetic', source: 'EcoNet Alpha',
  },
  {
    sensor_id: 'ECO-002', name: 'Industrial Zone A',
    latitude: 28.6280, longitude: 77.2350,
    last_seen: iso(subHours(now, 1)),
    latest_measurements: {
      PM25: { value: 145.8, unit: 'µg/m³', timestamp: iso(subHours(now, 1)) },
      PM10: { value: 238.5, unit: 'µg/m³', timestamp: iso(subHours(now, 1)) },
    },
    data_freshness: 'fresh', integrity_status: 'suspicious',
    anomaly_score: 0.82, reasons: ['Unusually high PM2.5 vs neighbours', 'Spatial residual > 2σ'],
    provenance: 'synthetic', source: 'EcoNet Alpha',
  },
  {
    sensor_id: 'ECO-003', name: 'Residential West',
    latitude: 28.6520, longitude: 77.1980,
    last_seen: iso(subHours(now, 2)),
    latest_measurements: {
      PM25: { value: 48.7, unit: 'µg/m³', timestamp: iso(subHours(now, 2)) },
      PM10: { value: 89.4, unit: 'µg/m³', timestamp: iso(subHours(now, 2)) },
    },
    data_freshness: 'stale', integrity_status: 'normal',
    anomaly_score: 0.15, reasons: [], provenance: 'synthetic', source: 'EcoNet Beta',
  },
  {
    sensor_id: 'ECO-004', name: 'Hospital Campus',
    latitude: 28.6610, longitude: 77.2210,
    last_seen: iso(subHours(now, 3)),
    latest_measurements: {
      PM25: { value: 18.2, unit: 'µg/m³', timestamp: iso(subHours(now, 3)) },
      PM10: { value: 31.0, unit: 'µg/m³', timestamp: iso(subHours(now, 3)) },
    },
    data_freshness: 'stale', integrity_status: 'suspicious',
    anomaly_score: 0.73, reasons: ['Readings 60% below spatial expectation', 'Possible calibration drift'],
    provenance: 'synthetic', source: 'EcoNet Beta',
  },
  {
    sensor_id: 'ECO-005', name: 'Central Market',
    latitude: 28.6490, longitude: 77.2290,
    last_seen: iso(subHours(now, 0.25)),
    latest_measurements: {
      PM25: { value: 77.4, unit: 'µg/m³', timestamp: iso(subHours(now, 0.25)) },
      PM10: { value: 132.2, unit: 'µg/m³', timestamp: iso(subHours(now, 0.25)) },
    },
    data_freshness: 'fresh', integrity_status: 'normal',
    anomaly_score: 0.19, reasons: [], provenance: 'synthetic', source: 'EcoNet Alpha',
  },
  {
    sensor_id: 'ECO-006', name: 'University Campus',
    latitude: 28.6700, longitude: 77.2050,
    last_seen: iso(subHours(now, 6)),
    latest_measurements: {},
    data_freshness: 'unavailable', integrity_status: 'insufficient_data',
    anomaly_score: null, reasons: ['No data received in 6+ hours'],
    provenance: 'synthetic', source: 'EcoNet Beta',
  },
  {
    sensor_id: 'ECO-007', name: 'Transport Hub',
    latitude: 28.6350, longitude: 77.2180,
    last_seen: iso(subHours(now, 0.1)),
    latest_measurements: {
      PM25: { value: 55.5, unit: 'µg/m³', timestamp: iso(subHours(now, 0.1)) },
      PM10: { value: 55.5, unit: 'µg/m³', timestamp: iso(subHours(now, 0.2)) },
    },
    data_freshness: 'fresh', integrity_status: 'suspicious',
    anomaly_score: 0.91, reasons: ['PM2.5 == PM10 for 4 consecutive readings (flatline pattern)'],
    provenance: 'synthetic', source: 'EcoNet Alpha',
  },
  {
    sensor_id: 'ECO-008', name: 'Green Park',
    latitude: 28.6580, longitude: 77.2400,
    last_seen: iso(subHours(now, 0.75)),
    latest_measurements: {
      PM25: { value: 38.1, unit: 'µg/m³', timestamp: iso(subHours(now, 0.75)) },
      PM10: { value: 65.3, unit: 'µg/m³', timestamp: iso(subHours(now, 0.75)) },
    },
    data_freshness: 'fresh', integrity_status: 'normal',
    anomaly_score: 0.07, reasons: [], provenance: 'synthetic', source: 'EcoNet Alpha',
  },
  {
    sensor_id: 'ECO-009', name: 'Eastern Suburb',
    latitude: 28.6400, longitude: 77.2550,
    last_seen: iso(subHours(now, 1.5)),
    latest_measurements: {
      PM25: { value: 93.7, unit: 'µg/m³', timestamp: iso(subHours(now, 1.5)) },
      PM10: { value: 158.4, unit: 'µg/m³', timestamp: iso(subHours(now, 1.5)) },
    },
    data_freshness: 'fresh', integrity_status: 'under_review',
    anomaly_score: 0.55, reasons: ['Spike detected 2h ago', 'Under review by analyst'],
    provenance: 'synthetic', source: 'EcoNet Alpha',
  },
  {
    sensor_id: 'ECO-010', name: 'South District',
    latitude: 28.6200, longitude: 77.2150,
    last_seen: iso(subHours(now, 0.5)),
    latest_measurements: {
      PM25: { value: 71.2, unit: 'µg/m³', timestamp: iso(subHours(now, 0.5)) },
      PM10: { value: 119.8, unit: 'µg/m³', timestamp: iso(subHours(now, 0.5)) },
    },
    data_freshness: 'fresh', integrity_status: 'normal',
    anomaly_score: 0.22, reasons: [], provenance: 'synthetic', source: 'EcoNet Beta',
  },
];

export const INCIDENTS: Incident[] = [
  {
    incident_id: 'INC-2024-001',
    created_at: iso(subHours(now, 3)),
    severity: 'critical',
    status: 'investigating',
    type: 'flatline',
    sensor_ids: ['ECO-007'],
    summary: 'Sensor ECO-007 (Transport Hub) has reported identical PM2.5 and PM10 values across 4 consecutive measurement cycles, suggesting a stuck or malfunctioning sensor.',
    evidence_refs: ['EVD-001'],
    is_simulated: false,
    confidence: 0.91,
    detector_reasons: ['PM2.5 == PM10 (55.5 µg/m³) for 4 readings', 'Z-score of variance: 0.0', 'Expected variance: 8.3'],
    last_observed: iso(subHours(now, 0.1)),
    analyst_notes: '',
  },
  {
    incident_id: 'INC-2024-002',
    created_at: iso(subHours(now, 5)),
    severity: 'high',
    status: 'open',
    type: 'spatial_inconsistency',
    sensor_ids: ['ECO-004'],
    summary: 'Sensor ECO-004 (Hospital Campus) is reporting PM2.5 values ~60% below the spatial expectation derived from neighbouring sensors, raising concern of calibration drift or sensor fault.',
    evidence_refs: ['EVD-002'],
    is_simulated: false,
    confidence: 0.73,
    detector_reasons: ['Spatial residual: -42.1 µg/m³ (−2.8σ)', 'Kriging expectation: 60.4 µg/m³', 'Reported: 18.2 µg/m³'],
    last_observed: iso(subHours(now, 3)),
  },
  {
    incident_id: 'INC-2024-003',
    created_at: iso(subHours(now, 7)),
    severity: 'high',
    status: 'open',
    type: 'unusual_spike',
    sensor_ids: ['ECO-002'],
    summary: 'Sensor ECO-002 (Industrial Zone A) is reporting PM2.5 at 145.8 µg/m³ — significantly higher than surrounding sensors. Could indicate genuine industrial activity or sensor malfunction.',
    evidence_refs: ['EVD-003'],
    is_simulated: false,
    confidence: 0.82,
    detector_reasons: ['Local spatial mean: 64.2 µg/m³', 'Reported: 145.8 µg/m³ (+81.6 µg/m³ deviation)', 'Isolation Forest score: 0.82'],
    last_observed: iso(subHours(now, 1)),
  },
  {
    incident_id: 'INC-2024-004',
    created_at: iso(subDays(now, 1)),
    severity: 'medium',
    status: 'resolved',
    type: 'stale_data',
    sensor_ids: ['ECO-006'],
    summary: 'Sensor ECO-006 (University Campus) stopped reporting data. No measurements received in over 6 hours.',
    evidence_refs: ['EVD-004'],
    is_simulated: false,
    confidence: null,
    detector_reasons: ['Last seen: 6h ago', 'Expected reporting interval: 15 min'],
    last_observed: iso(subHours(now, 6)),
  },
  {
    incident_id: 'INC-2024-005',
    created_at: iso(subDays(now, 2)),
    severity: 'low',
    status: 'false_positive',
    type: 'calibration_drift',
    sensor_ids: ['ECO-003'],
    summary: '[SIMULATION] Scenario: Calibration Drift – ECO-003 was subjected to a 10% gradual offset in a local dataset copy for testing detector sensitivity.',
    evidence_refs: ['EVD-005'],
    is_simulated: true,
    confidence: 0.68,
    detector_reasons: ['Gradual offset of +6.4 µg/m³ over 4 hours detected', 'Reference expected: 42.3 µg/m³'],
    last_observed: iso(subDays(now, 2)),
  },
  {
    incident_id: 'INC-2024-006',
    created_at: iso(subHours(now, 12)),
    severity: 'medium',
    status: 'investigating',
    type: 'unknown_anomaly',
    sensor_ids: ['ECO-009'],
    summary: 'Sensor ECO-009 (Eastern Suburb) recorded a PM2.5 spike two hours ago. Cause is unclear — possible traffic event, dust storm, or sensor artifact.',
    evidence_refs: ['EVD-006'],
    is_simulated: false,
    confidence: 0.55,
    detector_reasons: ['Value jumped from 55.2 to 93.7 µg/m³ in one interval', 'No corroboration from adjacent sensors'],
    last_observed: iso(subHours(now, 1.5)),
  },
];

export const EVIDENCE_RECORDS: EvidenceRecord[] = [
  {
    schema_version: '1.0',
    incident_id: 'INC-2024-001',
    created_at: iso(subHours(now, 3)),
    sensor_ids: ['ECO-007'],
    data_source: 'EcoNet Alpha (synthetic)',
    scenario_id: null,
    detector: {
      name: 'FlatnessDetector',
      version: '1.2.0',
      features: { consecutive_identical_readings: 4, pm25_variance_window: 0.0, expected_variance: 8.3 },
    },
    observed_values: { PM25: 55.5, PM10: 55.5 },
    expected_values: { PM25: 62.1, PM10: 98.4 },
    anomaly_reasons: ['PM2.5 equals PM10 for 4 consecutive cycles', 'Near-zero variance in rolling window'],
    decision_delta: {
      official_aqi: 112, integrity_aware_aqi: 108,
      note: 'Sensor excluded from integrity-aware estimate; minimal impact on area AQI',
    },
    limitations: [
      'Flatline may reflect genuine atmospheric stability under certain conditions',
      'Requires field verification before attributing to sensor fault',
    ],
  },
  {
    schema_version: '1.0',
    incident_id: 'INC-2024-002',
    created_at: iso(subHours(now, 5)),
    sensor_ids: ['ECO-004'],
    data_source: 'EcoNet Beta (synthetic)',
    scenario_id: null,
    detector: {
      name: 'SpatialResidualDetector',
      version: '2.0.1',
      features: { spatial_residual: -42.1, sigma: -2.8, kriging_method: 'ordinary' },
    },
    observed_values: { PM25: 18.2 },
    expected_values: { PM25: 60.4 },
    anomaly_reasons: ['Value 60% below spatial expectation', 'Residual exceeds −2.5σ threshold'],
    decision_delta: {
      official_aqi: 98, integrity_aware_aqi: 112,
      note: 'Excluding this sensor raises the integrity-aware AQI by 14 points — crosses Unhealthy for Sensitive Groups threshold',
    },
    limitations: [
      'Spatial interpolation assumes sensor placement uniformity',
      'Hospital HVAC systems may genuinely suppress local particulate readings',
    ],
  },
];

// ─── Time-series fixture data ─────────────────────────────────────────────────

export function generateTimeSeries(
  sensorId: string,
  pollutant: 'PM25' | 'PM10',
  hours = 24,
  baseValue = 65,
): { timestamp: string; value: number; sensor_id: string }[] {
  const series = [];
  for (let i = hours; i >= 0; i--) {
    const t = subHours(now, i);
    const noise = (Math.sin(i * 0.8) * 15) + (Math.random() * 8 - 4);
    const diurnalBias = Math.sin((t.getHours() / 24) * Math.PI * 2) * 10;
    series.push({
      timestamp: iso(t),
      value: Math.max(5, parseFloat((baseValue + noise + diurnalBias).toFixed(1))),
      sensor_id: sensorId,
    });
  }
  return series;
}

// ─── KPI fixture ──────────────────────────────────────────────────────────────

export const KPI_DATA: KpiData = {
  total_sensors: SENSORS.length,
  reporting_sensors: SENSORS.filter(s => s.data_freshness === 'fresh').length,
  flagged_anomalies: INCIDENTS.filter(i => ['open', 'investigating'].includes(i.status)).length,
  stale_measurements: SENSORS.filter(s => s.data_freshness !== 'fresh').length,
  last_refresh: iso(subHours(now, 0.05)),
};

// ─── AQI comparison ───────────────────────────────────────────────────────────

export const AQI_COMPARISON: AqiComparison = {
  location: 'Synthetic Metro Region',
  timestamp: iso(now),
  official_aqi: 107,
  official_category: 'Unhealthy for Sensitive Groups',
  integrity_aware_aqi: 121,
  integrity_aware_category: 'Unhealthy',
  flagged_sensor_count: 3,
  total_sensor_count: SENSORS.length,
  confidence: 0.74,
  dominant_pollutant: 'PM25',
  notes: [
    'Integrity-aware estimate excludes ECO-004 and ECO-007 due to active integrity flags.',
    'ECO-002 is under investigation; its values are weighted at 40%.',
    'Calculation follows US EPA NowCast methodology for PM2.5.',
    'This is a synthetic estimate — not an official regulatory determination.',
  ],
};

// ─── SOC status (unavailable = honest state) ─────────────────────────────────

export const SOC_STATUS: SocStatus = {
  connected: false,
  backend_version: null,
  last_heartbeat: null,
  unreviewed_count: INCIDENTS.filter(i => i.status === 'open').length,
  model_available: false,
  message: 'No SOC backend configured. Connect a compatible SIEM adapter to enable integration.',
};

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const SCENARIOS = [
  {
    id: 'none',
    label: 'Baseline',
    description: 'Unmodified reference dataset with no synthetic perturbations.',
  },
  {
    id: 'calibration_drift',
    label: 'Calibration Drift',
    description: 'Applies a clearly labeled +10% gradual offset to a local copy of ECO-003 measurements over 4 hours.',
  },
  {
    id: 'single_clean_lie',
    label: 'Single Sensor Anomaly',
    description: 'Simulates ECO-004 (Hospital Campus) reporting unusually clean air (15 µg/m³ PM2.5) versus its spatial expectation (~60 µg/m³).',
  },
  {
    id: 'coordinated_cluster',
    label: 'Cluster Anomaly',
    description: 'Simulates correlated low readings across ECO-004, ECO-008, and ECO-001 — a multi-sensor inconsistency pattern.',
  },
  {
    id: 'flatline',
    label: 'Flatline',
    description: 'Simulates ECO-007 repeatedly reporting identical PM2.5 = PM10 = 55.5 µg/m³ for 8 consecutive cycles.',
  },
] as const;

// ─── Dashboard measurement series ─────────────────────────────────────────────

export const DASHBOARD_SERIES = Array.from({ length: 48 }, (_, i) => {
  const t = subHours(now, 47 - i);
  return {
    timestamp: format(t, 'HH:mm'),
    date: iso(t),
    pm25: Math.max(10, 65 + Math.sin(i * 0.4) * 18 + Math.random() * 6),
    pm10: Math.max(20, 108 + Math.sin(i * 0.4) * 28 + Math.random() * 10),
    official_aqi: Math.max(50, 107 + Math.sin(i * 0.35) * 20),
    integrity_aqi: Math.max(55, 121 + Math.sin(i * 0.35) * 22),
  };
});

// ─── Helper: measurements list ────────────────────────────────────────────────

export function allMeasurements(): EnvironmentalMeasurement[] {
  return SENSORS.flatMap(s =>
    Object.entries(s.latest_measurements).map(([pollutant, m]) => ({
      sensor_id: s.sensor_id,
      timestamp: m.timestamp,
      latitude: s.latitude,
      longitude: s.longitude,
      pollutant: pollutant as any,
      value: m.value,
      unit: m.unit,
      source: s.source ?? 'unknown',
      quality_status: s.data_freshness === 'fresh' ? 'valid' : s.data_freshness === 'stale' ? 'stale' : 'missing',
      provenance: s.provenance,
      scenario_id: null,
    }))
  );
}
