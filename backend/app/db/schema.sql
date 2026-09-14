CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS farmers (
    farmer_id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    region VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farms (
    farm_id UUID PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id),
    farm_name VARCHAR(150) NOT NULL,
    region VARCHAR(100) NOT NULL,
    area_ha DOUBLE PRECISION CHECK (area_ha > 0),
    geometry GEOGRAPHY(MULTIPOLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tractor_owners (
    owner_id UUID PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(30),
    region VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tractors (
    tractor_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES tractor_owners(owner_id),
    model VARCHAR(80) NOT NULL,
    status VARCHAR(30) DEFAULT 'available',
    capacity_ha_hr DOUBLE PRECISION NOT NULL,
    current_lat DOUBLE PRECISION,
    current_lon DOUBLE PRECISION,
    region VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operators (
    operator_id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tractor_id UUID REFERENCES tractors(tractor_id),
    rating DOUBLE PRECISION DEFAULT 0,
    region VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id UUID PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id),
    farm_id UUID REFERENCES farms(farm_id),
    tractor_id UUID REFERENCES tractors(tractor_id),
    service_type VARCHAR(80) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    amount DOUBLE PRECISION CHECK (amount >= 0),
    region VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_operations (
    field_operation_id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(booking_id),
    tractor_id UUID NOT NULL REFERENCES tractors(tractor_id),
    operation_type VARCHAR(80) NOT NULL,
    hectares DOUBLE PRECISION,
    fuel_consumed DOUBLE PRECISION,
    status VARCHAR(30),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
    telemetry_id UUID PRIMARY KEY,
    tractor_id UUID NOT NULL REFERENCES tractors(tractor_id),
    observed_at TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    engine_hours DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    operating_hours DOUBLE PRECISION,
    speed_kmh DOUBLE PRECISION,
    temperature_c DOUBLE PRECISION,
    fuel_level DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(booking_id),
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id),
    amount DOUBLE PRECISION CHECK (amount >= 0),
    payment_status VARCHAR(30) DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    invoice_number VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance (
    maintenance_id UUID PRIMARY KEY,
    tractor_id UUID NOT NULL REFERENCES tractors(tractor_id),
    service_date TIMESTAMPTZ NOT NULL,
    engine_hours DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    maintenance_type VARCHAR(80),
    cost DOUBLE PRECISION,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_observations (
    weather_id UUID PRIMARY KEY,
    farm_id UUID REFERENCES farms(farm_id),
    observed_at TIMESTAMPTZ NOT NULL,
    temperature_c DOUBLE PRECISION,
    rainfall_mm DOUBLE PRECISION,
    humidity_pct DOUBLE PRECISION,
    wind_kmh DOUBLE PRECISION,
    source VARCHAR(50) DEFAULT 'api',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS satellite_observations (
    satellite_observation_id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(farm_id),
    observation_date TIMESTAMPTZ NOT NULL,
    source_product_id VARCHAR(200),
    mean_ndvi DOUBLE PRECISION,
    mean_ndwi DOUBLE PRECISION,
    cloud_percentage DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vegetation_metrics (
    vegetation_metric_id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(farm_id),
    observation_date TIMESTAMPTZ NOT NULL,
    mean_ndvi DOUBLE PRECISION,
    std_ndvi DOUBLE PRECISION,
    mean_ndwi DOUBLE PRECISION,
    trend_ndvi DOUBLE PRECISION,
    vegetation_status VARCHAR(40),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_quality_results (
    quality_run_id UUID PRIMARY KEY,
    dataset_name VARCHAR(100) NOT NULL,
    records_total INTEGER NOT NULL,
    valid_count INTEGER NOT NULL,
    invalid_count INTEGER NOT NULL,
    completeness_score DOUBLE PRECISION,
    validity_score DOUBLE PRECISION,
    uniqueness_score DOUBLE PRECISION,
    freshness_score DOUBLE PRECISION,
    overall_score DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    pipeline_run_id UUID PRIMARY KEY,
    pipeline_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    records_processed INTEGER,
    failed_records INTEGER,
    duration_seconds INTEGER,
    last_run_at TIMESTAMPTZ,
    data_freshness_hours DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms (farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings (farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tractor_id ON bookings (tractor_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_tractor_id ON telemetry (tractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tractor_id ON maintenance (tractor_id);
CREATE INDEX IF NOT EXISTS idx_satellite_farm_id ON satellite_observations (farm_id);
CREATE INDEX IF NOT EXISTS idx_vegetation_farm_id ON vegetation_metrics (farm_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requested_at ON bookings (requested_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_observed_at ON telemetry (observed_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_name ON pipeline_runs (pipeline_name);

CREATE INDEX IF NOT EXISTS idx_farms_geom ON farms USING GIST (geometry);
