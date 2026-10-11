/**
 * Typed API service layer.
 * Uses mock fixtures since no real backend is configured.
 * Replace the implementations here with real fetch() calls when a backend exists.
 */
import {
  SENSORS, INCIDENTS, EVIDENCE_RECORDS, KPI_DATA, AQI_COMPARISON,
  SOC_STATUS, SCENARIOS, DASHBOARD_SERIES, generateTimeSeries,
} from '@/services/mock/fixtures';
import type {
  SensorSummary, Incident, EvidenceRecord, KpiData, AqiComparison, SocStatus,
} from '@/types';

// ── Simulated network delay ────────────────────────────────────────────────
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ── Sensor endpoints ───────────────────────────────────────────────────────
export async function fetchSensors(): Promise<SensorSummary[]> {
  await delay(500);
  return [...SENSORS];
}

export async function fetchSensor(id: string): Promise<SensorSummary | null> {
  await delay(200);
  return SENSORS.find(s => s.sensor_id === id) ?? null;
}

export async function fetchTimeSeries(
  sensorId: string,
  pollutant: 'PM25' | 'PM10' = 'PM25',
  hours = 24,
): Promise<{ timestamp: string; value: number; sensor_id: string }[]> {
  await delay(300);
  const sensor = SENSORS.find(s => s.sensor_id === sensorId);
  const base = sensor?.latest_measurements?.[pollutant]?.value ?? 60;
  return generateTimeSeries(sensorId, pollutant, hours, base);
}

// ── KPI ────────────────────────────────────────────────────────────────────
export async function fetchKpi(): Promise<KpiData> {
  await delay(300);
  return { ...KPI_DATA };
}

// ── Incidents ─────────────────────────────────────────────────────────────
export async function fetchIncidents(): Promise<Incident[]> {
  await delay(400);
  return [...INCIDENTS];
}

export async function fetchIncident(id: string): Promise<Incident | null> {
  await delay(200);
  return INCIDENTS.find(i => i.incident_id === id) ?? null;
}

export async function updateIncidentStatus(
  id: string,
  status: Incident['status'],
  notes?: string,
): Promise<Incident | null> {
  await delay(400);
  const idx = INCIDENTS.findIndex(i => i.incident_id === id);
  if (idx === -1) return null;
  INCIDENTS[idx] = { ...INCIDENTS[idx], status, analyst_notes: notes ?? INCIDENTS[idx].analyst_notes };
  return INCIDENTS[idx];
}

// ── Evidence ───────────────────────────────────────────────────────────────
export async function fetchEvidence(incidentId: string): Promise<EvidenceRecord[]> {
  await delay(300);
  return EVIDENCE_RECORDS.filter(e => e.incident_id === incidentId);
}

export async function fetchAllEvidence(): Promise<EvidenceRecord[]> {
  await delay(400);
  return [...EVIDENCE_RECORDS];
}

// ── AQI comparison ─────────────────────────────────────────────────────────
export async function fetchAqiComparison(): Promise<AqiComparison> {
  await delay(350);
  return { ...AQI_COMPARISON };
}

// ── Dashboard series ───────────────────────────────────────────────────────
export async function fetchDashboardSeries() {
  await delay(400);
  return [...DASHBOARD_SERIES];
}

// ── Scenarios ──────────────────────────────────────────────────────────────
export async function fetchScenarios() {
  await delay(200);
  return [...SCENARIOS];
}

let activeScenario: string | null = null;

export async function runScenario(id: string): Promise<{ success: boolean; scenario_id: string }> {
  await delay(800);
  activeScenario = id;
  return { success: true, scenario_id: id };
}

export async function resetScenario(): Promise<{ success: boolean }> {
  await delay(600);
  activeScenario = null;
  return { success: true };
}

export function getActiveScenario() { return activeScenario; }

// ── SOC status ─────────────────────────────────────────────────────────────
export async function fetchSocStatus(): Promise<SocStatus> {
  await delay(600);
  return { ...SOC_STATUS };
}

// ── Health check ───────────────────────────────────────────────────────────
export async function fetchHealth(): Promise<{ status: string; is_simulated: boolean }> {
  await delay(200);
  return { status: 'ok', is_simulated: true };
}
