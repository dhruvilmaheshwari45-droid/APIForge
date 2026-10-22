import API from '../models/API.js';
import axios from 'axios';

// @desc    Get all APIs / endpoints
// @route   GET /api/apis
// @access  Public
export const getAllAPIs = async (req, res, next) => {
  try {
    const { collectionId, method, search } = req.query;
    const filter = {};

    if (collectionId && collectionId !== 'ALL') {
      filter.collectionId = collectionId;
    }
    if (method && method !== 'ALL') {
      filter.method = method.toUpperCase();
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const apis = await API.find(filter).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: apis.length, data: apis });
  } catch (err) {
    next(err);
  }
};

// @desc    Get API by ID
// @route   GET /api/apis/:id
// @access  Public
export const getAPIById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const api = await API.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!api) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.status(200).json({ success: true, data: api });
  } catch (err) {
    next(err);
  }
};

// @desc    Create API endpoint
// @route   POST /api/apis
// @access  Public / Optional Auth
export const createAPI = async (req, res, next) => {
  try {
    const { collectionId = 'col_general', name, method, path, description, headers, queryParams, requestBody, responseExample } = req.body;

    if (!name || !path) {
      return res.status(400).json({ success: false, message: 'API name and path are required' });
    }

    const customId = `ep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const api = await API.create({
      customId,
      collectionId: collectionId || 'col_general',
      name: name.trim(),
      method: (method || 'GET').toUpperCase(),
      path: path.trim(),
      description: description || '',
      headers: headers || [],
      queryParams: queryParams || [],
      requestBody: requestBody || '',
      responseExample: responseExample || { status: 200, body: {} },
    });

    res.status(201).json({ success: true, data: api });
  } catch (err) {
    next(err);
  }
};

// @desc    Update API endpoint
// @route   PUT /api/apis/:id
// @access  Public / Optional Auth
export const updateAPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const api = await API.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!api) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }

    Object.assign(api, req.body);
    await api.save();

    res.status(200).json({ success: true, data: api });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete API endpoint
// @route   DELETE /api/apis/:id
// @access  Public / Optional Auth
export const deleteAPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const api = await API.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!api) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }

    await api.deleteOne();
    res.status(200).json({ success: true, message: 'API endpoint deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Server-side proxy execution of HTTP request (Day 5 & 6 execution service)
// @route   POST /api/apis/execute
// @access  Public
export const executeRequest = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { url, method = 'GET', headers = {}, params = {}, data = null, timeout = 10000 } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required for execution' });
    }

    let activeHeaders = {};
    if (Array.isArray(headers)) {
      headers.filter((h) => h && h.enabled !== false && h.key).forEach((h) => {
        activeHeaders[h.key] = h.value;
      });
    } else if (headers && typeof headers === 'object') {
      activeHeaders = { ...headers };
    }

    let activeParams = {};
    if (Array.isArray(params)) {
      params.filter((p) => p && p.enabled !== false && p.key).forEach((p) => {
        activeParams[p.key] = p.value;
      });
    } else if (params && typeof params === 'object') {
      activeParams = { ...params };
    }

    const response = await axios({
      url,
      method,
      headers: activeHeaders,
      params: activeParams,
      data,
      timeout,
      validateStatus: () => true, // capture all status codes (404, 500, etc. are valid responses)
    });

    const durationMs = Date.now() - startTime;
    res.status(200).json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      durationMs,
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    res.status(200).json({
      success: false,
      status: 0,
      statusText: 'Network / Connection Error',
      error: err.message,
      durationMs,
    });
  }
};

export default {
  getAllAPIs,
  getAPIById,
  createAPI,
  updateAPI,
  deleteAPI,
  executeRequest,
};
