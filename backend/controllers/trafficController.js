import TrafficLog from '../models/TrafficLog.js';

// @desc    Get traffic logs with filters, pagination, and sorting
// @route   GET /api/traffic
// @access  Public
export const getTrafficLogs = async (req, res, next) => {
  try {
    const {
      method,
      status,
      statusCode,
      environment,
      search,
      timeRange,
      page = 1,
      limit = 25,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (method && method !== 'ALL') {
      filter.method = method.toUpperCase();
    }

    if (statusCode && statusCode !== 'ALL') {
      filter.statusCode = parseInt(statusCode, 10);
    } else if (status && status !== 'ALL') {
      if (status === 'success' || status === '2xx') {
        filter.statusCode = { $gte: 200, $lt: 300 };
      } else if (status === 'error' || status === '4xx_5xx') {
        filter.statusCode = { $gte: 400 };
      }
    }

    if (environment && environment !== 'ALL') {
      filter.environment = environment;
    }

    if (search) {
      filter.$or = [
        { endpoint: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } },
        { requestId: { $regex: search, $options: 'i' } },
      ];
    }

    if (timeRange && timeRange !== 'ALL') {
      const now = Date.now();
      let ms = 24 * 3600 * 1000;
      if (timeRange === '15m') ms = 15 * 60 * 1000;
      if (timeRange === '1h') ms = 3600 * 1000;
      if (timeRange === '24h') ms = 24 * 3600 * 1000;
      if (timeRange === '7d') ms = 7 * 24 * 3600 * 1000;
      if (timeRange === '30d') ms = 30 * 24 * 3600 * 1000;
      filter.timestamp = { $gte: new Date(now - ms) };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await TrafficLog.countDocuments(filter);
    const logs = await TrafficLog.find(filter).sort(sort).skip(skip).limit(limitNum);

    // Compute stats
    const allMatching = await TrafficLog.find(filter, 'statusCode durationMs');
    const successful = allMatching.filter((l) => l.statusCode >= 200 && l.statusCode < 400).length;
    const failed = allMatching.length - successful;
    const avgResponseTime =
      allMatching.length > 0
        ? Math.round(allMatching.reduce((acc, curr) => acc + curr.durationMs, 0) / allMatching.length)
        : 0;

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      stats: {
        totalRequests: allMatching.length,
        successfulRequests: successful,
        failedRequests: failed,
        avgResponseTime,
      },
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get traffic log by ID or requestId
// @route   GET /api/traffic/:id
// @access  Public
export const getTrafficLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await TrafficLog.findOne({
      $or: [{ requestId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Traffic log entry not found' });
    }
    res.status(200).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
};

// @desc    Record new traffic log
// @route   POST /api/traffic
// @access  Public
export const createTrafficLog = async (req, res, next) => {
  try {
    const {
      method,
      url,
      endpoint,
      statusCode,
      statusText,
      durationMs,
      responseSize,
      requestHeaders,
      responseHeaders,
      requestBody,
      responseBody,
      environment,
      error,
      requestId,
    } = req.body;

    const reqId = requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const log = await TrafficLog.create({
      requestId: reqId,
      method: (method || 'GET').toUpperCase(),
      url: url || 'http://localhost/api',
      endpoint: endpoint || (url ? new URL(url, 'http://localhost').pathname : '/'),
      statusCode: statusCode || 200,
      statusText: statusText || 'OK',
      durationMs: durationMs || 0,
      responseSize: responseSize || 0,
      requestHeaders: requestHeaders || {},
      responseHeaders: responseHeaders || {},
      requestBody: typeof requestBody === 'object' ? JSON.stringify(requestBody) : (requestBody || ''),
      responseBody: responseBody || null,
      environment: environment || 'Development',
      error: error || null,
      timestamp: new Date(),
    });

    // Broadcast to Socket.io if initialized
    if (req.app.get('io')) {
      req.app.get('io').emit('traffic:new', log);
    }

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear all traffic logs
// @route   DELETE /api/traffic
// @access  Public
export const clearTrafficLogs = async (req, res, next) => {
  try {
    await TrafficLog.deleteMany({});
    res.status(200).json({ success: true, message: 'Traffic telemetry logs cleared successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
  getTrafficLogs,
  getTrafficLogById,
  createTrafficLog,
  clearTrafficLogs,
};
