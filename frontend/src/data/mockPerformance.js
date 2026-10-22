/**
 * APIForge - Performance Analytics Mock Data
 * 
 * Clean initial state with zero mock benchmarks.
 */

export const PERFORMANCE_ENDPOINTS = [];

export const TIME_SERIES_DATA = {
  '1h': [],
  '24h': [],
  '7d': [],
  '30d': [],
};

export const STATUS_CODE_BENCHMARKS = [];

export const ENVIRONMENT_PROFILES = {
  Production: {
    latencyMultiplier: 1.0,
    rpmMultiplier: 1.0,
    errorMultiplier: 1.0,
    availability: 100,
  },
  Staging: {
    latencyMultiplier: 1.0,
    rpmMultiplier: 1.0,
    errorMultiplier: 1.0,
    availability: 100,
  },
  Development: {
    latencyMultiplier: 1.0,
    rpmMultiplier: 1.0,
    errorMultiplier: 1.0,
    availability: 100,
  },
};
