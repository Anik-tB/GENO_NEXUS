-- ============================================================================
-- Migration: 004_outbreak_forecasts.sql
-- Adds: outbreak_forecasts table to cache AI-driven predictions
-- ============================================================================

CREATE TABLE IF NOT EXISTS outbreak_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region TEXT NOT NULL,
    pathogen TEXT NOT NULL,
    horizon TEXT NOT NULL,
    historical_points JSONB NOT NULL,
    future_points JSONB NOT NULL,
    alert_stats JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast retrieval based on filters
CREATE INDEX IF NOT EXISTS idx_outbreak_forecasts_filters ON outbreak_forecasts(region, pathogen, horizon, created_at DESC);

-- ============================================================================
-- Grant Privileges
-- ============================================================================
GRANT ALL PRIVILEGES ON TABLE outbreak_forecasts TO geno;
