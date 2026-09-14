export interface Paginated<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

export interface Summary {
  total_farmers: number;
  total_farms: number;
  total_tractors: number;
  active_tractors: number;
  utilization_rate: number;
  total_bookings: number;
  completed_jobs: number;
  revenue: number;
  outstanding_payments: number;
  avg_ndvi: number;
  supply_demand_gap: number;
  data_quality_score: number;
  pipeline_status: string;
  generated_at: string;
}

export interface Farmer {
  farmer_id: string;
  name: string;
  region: string;
  farms: number;
  phone: string;
  joined_at: string;
}

export interface Farm {
  farm_id: string;
  farmer_id: string;
  region: string;
  area_ha: number;
  lat: number;
  lon: number;
  ndvi: number;
  ndwi: number;
  cloud_pct: number;
  last_scan: string;
}

export interface Tractor {
  tractor_id: string;
  owner_id: string;
  model: string;
  status: 'active' | 'idle' | 'maintenance' | string;
  region: string;
  capacity_ha_hr: number;
  operating_hours: number;
  lat: number;
  lon: number;
  last_service_hours_ago: number;
}

export interface Booking {
  booking_id: string;
  farmer_id: string;
  tractor_id: string;
  region: string;
  status: 'completed' | 'pending' | 'cancelled' | string;
  crop_operation: string;
  amount: number;
  payment_status: 'paid' | 'pending' | 'void' | string;
  requested_at: string;
}

export interface Payment {
  payment_id: string;
  booking_id: string;
  farmer_id: string;
  amount: number;
  payment_status: string;
  requested_at: string;
}

export interface TelemetryReading {
  tractor_id: string;
  observed_at: string;
  speed_kmh: number;
  engine_hours: number;
  region: string;
}

export interface UtilizationMetrics {
  total_tractors: number;
  active_tractors: number;
  idle_tractors: number;
  operating_hours: number;
  utilization_rate: number;
  jobs_completed: number;
  revenue_per_tractor: number;
}

export interface UtilizationByRegion {
  region: string;
  total_tractors: number;
  active_tractors: number;
  idle_tractors: number;
  utilization_rate: number;
}

export interface DemandMetrics {
  bookings_per_region: Record<string, number>;
  bookings_per_operation: Record<string, number>;
  total_bookings: number;
}

export interface DemandTimeseriesPoint {
  month: string;
  bookings: number;
  revenue: number;
  completed: number;
}

export interface RevenueMetrics {
  gross_revenue: number;
  average_booking_value: number;
  completed_jobs: number;
}

export interface RevenueByRegion {
  region: string;
  revenue: number;
  completed_jobs: number;
  outstanding_payments: number;
}

export interface VegetationByRegion {
  region: string;
  farm_count: number;
  mean_ndvi: number;
  mean_ndwi: number;
  cloud_percentage: number;
  status: string;
}

export interface DataQualityDataset {
  dataset: string;
  records: number;
  valid: number;
  invalid: number;
  completeness: number;
  validity: number;
  uniqueness: number;
  freshness: number;
  overall_score: number;
}

export interface DataQualityReport {
  overall_score: number;
  datasets: DataQualityDataset[];
}

export interface PipelineRun {
  pipeline: string;
  status: 'success' | 'running' | 'failed' | string;
  last_run: string;
  records: number;
  failed: number;
}

export interface Recommendation {
  tractor_id: string;
  score: number;
  distance_km: number;
  available: boolean;
  capability: string;
  operator_rating: number;
  previous_jobs_nearby: number;
  rationale: string;
}

export interface GeoJsonFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: P;
  }>;
}

export type FarmProperties = Pick<Farm, 'farm_id' | 'farmer_id' | 'region' | 'area_ha' | 'ndvi' | 'ndwi' | 'last_scan'>;
export type TractorProperties = Pick<
  Tractor,
  'tractor_id' | 'model' | 'status' | 'region' | 'capacity_ha_hr' | 'operating_hours'
>;
