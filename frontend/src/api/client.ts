import type {
  Booking,
  DataQualityReport,
  DemandMetrics,
  DemandTimeseriesPoint,
  Farm,
  FarmProperties,
  Farmer,
  GeoJsonFeatureCollection,
  Paginated,
  Payment,
  PipelineRun,
  Recommendation,
  RevenueByRegion,
  RevenueMetrics,
  Summary,
  TelemetryReading,
  Tractor,
  TractorProperties,
  UtilizationByRegion,
  UtilizationMetrics,
  VegetationByRegion,
} from './types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new ApiError(response.status, `${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface ListParams {
  [key: string]: string | number | undefined;
  region?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  summary: () => request<Summary>('/summary'),
  regions: () => request<{ items: string[] }>('/regions'),

  farmers: (params: ListParams = {}) => request<Paginated<Farmer>>('/farmers', params),
  farms: (params: ListParams & { farmer_id?: string } = {}) => request<Paginated<Farm>>('/farms', params),
  farmsGeoJson: (region?: string) => request<GeoJsonFeatureCollection<FarmProperties>>('/farms/geojson', { region }),
  tractors: (params: ListParams = {}) => request<Paginated<Tractor>>('/tractors', params),
  tractorsGeoJson: (region?: string) =>
    request<GeoJsonFeatureCollection<TractorProperties>>('/tractors/geojson', { region }),
  bookings: (params: ListParams & { crop_operation?: string } = {}) =>
    request<Paginated<Booking>>('/bookings', params),
  payments: (params: ListParams = {}) => request<Paginated<Payment>>('/payments', params),
  telemetry: (limit = 25) => request<{ total: number; items: TelemetryReading[] }>('/telemetry', { limit }),

  pipelineStatus: () => request<{ total: number; items: PipelineRun[] }>('/pipeline-status'),
  dataQuality: () => request<DataQualityReport>('/data-quality'),

  vegetation: (region?: string) => request<{ total: number; items: VegetationByRegion[] }>('/vegetation', { region }),
  vegetationWatchlist: (threshold = 0.35, limit = 25) =>
    request<{ total: number; items: Farm[] }>('/vegetation/watchlist', { threshold, limit }),

  utilization: () => request<UtilizationMetrics>('/analytics/utilization'),
  utilizationByRegion: () => request<{ items: UtilizationByRegion[] }>('/analytics/utilization/by-region'),
  demand: () => request<DemandMetrics>('/analytics/demand'),
  demandTimeseries: () => request<{ items: DemandTimeseriesPoint[] }>('/analytics/demand/timeseries'),
  revenue: () => request<RevenueMetrics>('/analytics/revenue'),
  revenueByRegion: () => request<{ items: RevenueByRegion[] }>('/analytics/revenue/by-region'),

  recommendations: (farmId: string, limit = 10) =>
    request<Recommendation[]>('/recommendations/tractor', { farm_id: farmId, limit }),
};
