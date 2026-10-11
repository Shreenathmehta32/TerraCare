// ─── Core Domain Types ───────────────────────────────────────────────────────

export type Pollutant = 'PM25' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO';

export type QualityStatus = 'valid' | 'missing' | 'stale' | 'invalid';
export type Provenance = 'public' | 'historical' | 'synthetic' | 'hardware';
export type DataFreshness = 'fresh' | 'stale' | 'unavailable';
export type IntegrityStatus = 'normal' | 'suspicious' | 'under_review' | 'insufficient_data';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';
export type IncidentType =
  | 'calibration_drift'
  | 'flatline'
  | 'spatial_inconsistency'
  | 'unusual_spike'
  | 'stale_data'
  | 'simulated_manipulation'
  | 'unknown_anomaly';

export type ScenarioId =
  | 'none'
  | 'calibration_drift'
  | 'single_clean_lie'
  | 'coordinated_cluster'
  | 'flatline';

// ─── Data Contracts ──────────────────────────────────────────────────────────

export interface EnvironmentalMeasurement {
  sensor_id: string;
  timestamp: string; // ISO-8601
  latitude: number | null;
  longitude: number | null;
  pollutant: Pollutant;
  value: number | null;
  unit: string;
  source: string;
  quality_status: QualityStatus;
  provenance: Provenance;
  scenario_id: string | null;
}

export interface SensorSummary {
  sensor_id: string;
  name?: string;
  latitude: number | null;
  longitude: number | null;
  last_seen: string | null;
  latest_measurements: Partial<Record<Pollutant, { value: number; unit: string; timestamp: string }>>;
  data_freshness: DataFreshness;
  integrity_status: IntegrityStatus;
  anomaly_score: number | null;
  reasons: string[];
  provenance: Provenance;
  source?: string;
  is_simulated?: boolean;
}

export interface Incident {
  incident_id: string;
  created_at: string; // ISO-8601
  severity: IncidentSeverity;
  status: IncidentStatus;
  type: IncidentType;
  sensor_ids: string[];
  summary: string;
  evidence_refs: string[];
  is_simulated: boolean;
  confidence: number | null;
  detector_reasons?: string[];
  last_observed?: string;
  analyst_notes?: string;
}

export interface EvidenceRecord {
  schema_version: string;
  incident_id: string;
  created_at: string;
  sensor_ids: string[];
  data_source: string;
  scenario_id: string | null;
  detector: {
    name: string;
    version: string;
    features: Record<string, unknown>;
  };
  observed_values: Record<string, unknown>;
  expected_values: Record<string, unknown>;
  anomaly_reasons: string[];
  decision_delta: Record<string, unknown>;
  limitations: string[];
}

export interface AqiComparison {
  location: string;
  timestamp: string;
  official_aqi: number;
  official_category: string;
  integrity_aware_aqi: number;
  integrity_aware_category: string;
  flagged_sensor_count: number;
  total_sensor_count: number;
  confidence: number;
  dominant_pollutant: Pollutant;
  notes: string[];
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    request_id: string | null;
    generated_at: string | null;
    source: string | null;
    is_simulated: boolean;
  };
  error: { code: string; message: string } | null;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface FilterState {
  search: string;
  pollutant: Pollutant | 'all';
  status: IntegrityStatus | 'all';
  severity: IncidentSeverity | 'all';
  freshness: DataFreshness | 'all';
  dateFrom: string;
  dateTo: string;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
}

export interface SocStatus {
  connected: boolean;
  backend_version: string | null;
  last_heartbeat: string | null;
  unreviewed_count: number;
  model_available: boolean;
  message: string;
}

export interface KpiData {
  total_sensors: number;
  reporting_sensors: number;
  flagged_anomalies: number;
  stale_measurements: number;
  last_refresh: string;
}
