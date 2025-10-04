-- ClickHouse Schema Definition for Trading Agent Backend
-- Run this script to initialize your ClickHouse database

-- Database creation
CREATE DATABASE IF NOT EXISTS trading_agent;

USE trading_agent;

-- Prices table - stores time-series price data
CREATE TABLE IF NOT EXISTS prices (
  symbol String,
  ts DateTime,
  open Float64,
  high Float64,
  low Float64,
  close Float64,
  volume Float64,
  INDEX symbol_idx symbol TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (symbol, ts)
TTL ts + INTERVAL 365 DAY;

-- Structured events table - stores processed news, filings, and events
CREATE TABLE IF NOT EXISTS events_structured (
  symbol String,
  ts DateTime,
  type String,
  summary String,
  url String,
  lang String,
  translated_summary String,
  INDEX symbol_idx symbol TYPE bloom_filter GRANULARITY 1,
  INDEX type_idx type TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (symbol, ts)
TTL ts + INTERVAL 365 DAY;

-- Raw events table - stores unprocessed news and filings before processing
CREATE TABLE IF NOT EXISTS events_raw (
  symbol String,
  ts DateTime,
  source String,
  headline String,
  content String,
  url String,
  lang String,
  processed UInt8 DEFAULT 0,
  INDEX symbol_idx symbol TYPE bloom_filter GRANULARITY 1,
  INDEX processed_idx processed TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (symbol, ts)
TTL ts + INTERVAL 365 DAY;

-- Annotations table - stores agent-generated annotations
CREATE TABLE IF NOT EXISTS annotations (
  symbol String,
  ts DateTime,
  tag String,
  note String,
  source_tool String,
  created_at DateTime DEFAULT now(),
  INDEX symbol_idx symbol TYPE bloom_filter GRANULARITY 1,
  INDEX tag_idx tag TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (symbol, ts, created_at)
TTL ts + INTERVAL 365 DAY;

-- Alternative data table - stores metrics from LinkUp and other sources
CREATE TABLE IF NOT EXISTS alt_data (
  symbol String,
  ts DateTime,
  metric String,
  value Float64,
  source String DEFAULT 'linkup',
  INDEX symbol_idx symbol TYPE bloom_filter GRANULARITY 1,
  INDEX metric_idx metric TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (symbol, metric, ts)
TTL ts + INTERVAL 365 DAY;

-- Inflection points table - stores detected price inflection points
CREATE TABLE IF NOT EXISTS inflection_points (
  symbol String,
  ts DateTime,
  score Float64,
  price Float64,
  detected_at DateTime DEFAULT now(),
  INDEX symbol_idx symbol TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (symbol, ts)
TTL ts + INTERVAL 365 DAY;

-- Pipeline jobs table - tracks background processing jobs
CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id String,
  type String,
  symbol String,
  start_time DateTime,
  end_time DateTime,
  status String,
  error String DEFAULT '',
  created_at DateTime DEFAULT now(),
  completed_at DateTime DEFAULT toDateTime('1970-01-01 00:00:00'),
  INDEX symbol_idx symbol TYPE bloom_filter GRANULARITY 1,
  INDEX status_idx status TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
ORDER BY (created_at, id)
TTL created_at + INTERVAL 30 DAY;

-- Tool metrics table - tracks tool invocation performance
CREATE TABLE IF NOT EXISTS tool_metrics (
  tool_name String,
  ts DateTime DEFAULT now(),
  duration_ms UInt32,
  success UInt8,
  error String DEFAULT '',
  symbol String DEFAULT '',
  INDEX tool_idx tool_name TYPE bloom_filter GRANULARITY 1,
  INDEX success_idx success TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (tool_name, ts)
TTL ts + INTERVAL 90 DAY;

-- Materialized views for analytics

-- Daily price aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS prices_daily
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (symbol, date)
AS SELECT
  symbol,
  toDate(ts) as date,
  argMin(open, ts) as open,
  max(high) as high,
  min(low) as low,
  argMax(close, ts) as close,
  sum(volume) as volume,
  count() as ticks
FROM prices
GROUP BY symbol, date;

-- Event counts by type and day
CREATE MATERIALIZED VIEW IF NOT EXISTS events_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (symbol, type, date)
AS SELECT
  symbol,
  type,
  toDate(ts) as date,
  count() as event_count
FROM events_structured
GROUP BY symbol, type, date;

-- Tool performance metrics by hour
CREATE MATERIALIZED VIEW IF NOT EXISTS tool_performance_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (tool_name, hour)
AS SELECT
  tool_name,
  toStartOfHour(ts) as hour,
  avg(duration_ms) as avg_duration_ms,
  count() as call_count,
  sum(success) as success_count,
  sum(1 - success) as error_count
FROM tool_metrics
GROUP BY tool_name, hour;
