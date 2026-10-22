import MockServer from '../models/MockServer.js';
import MockRule from '../models/MockRule.js';

// @desc    Get all mock servers
// @route   GET /api/mock-servers
// @access  Public
export const getMockServers = async (req, res, next) => {
  try {
    const servers = await MockServer.find().sort({ createdAt: -1 });
    const rules = await MockRule.find({}, 'serverId');

    const mapped = servers.map((s) => {
      const obj = s.toJSON();
      const count = rules.filter(
        (r) => r.serverId === obj.id || r.serverId === s.customId || r.serverId === s._id.toString()
      ).length;
      return { ...obj, endpointsCount: count || s.endpointsCount || 0 };
    });

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

// @desc    Get mock server by ID
// @route   GET /api/mock-servers/:id
// @access  Public
export const getMockServerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await MockServer.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!server) {
      return res.status(404).json({ success: false, message: 'Mock server not found' });
    }

    const srvObj = server.toJSON();
    const rules = await MockRule.find({
      $or: [{ serverId: srvObj.id }, { serverId: id }, { serverId: server._id.toString() }],
    });

    res.status(200).json({
      success: true,
      data: { ...srvObj, rules },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create mock server
// @route   POST /api/mock-servers
// @access  Public / Optional Auth
export const createMockServer = async (req, res, next) => {
  try {
    const { name, description, baseUrl, status, environment, port, defaultLatencyMs } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Mock server name is required' });
    }

    const customId = `msrv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const server = await MockServer.create({
      customId,
      name: name.trim(),
      description: description || '',
      baseUrl: baseUrl || `http://localhost:${port || 8080}`,
      status: status || 'active',
      environment: environment || 'Development',
      port: port || 8080,
      defaultLatencyMs: defaultLatencyMs || 100,
      isSimulated: true,
      endpointsCount: 0,
    });

    res.status(201).json({ success: true, data: server });
  } catch (err) {
    next(err);
  }
};

// @desc    Update mock server
// @route   PUT /api/mock-servers/:id
// @access  Public / Optional Auth
export const updateMockServer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await MockServer.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!server) {
      return res.status(404).json({ success: false, message: 'Mock server not found' });
    }

    Object.assign(server, req.body);
    await server.save();

    res.status(200).json({ success: true, data: server });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle mock server status (active / paused)
// @route   PATCH /api/mock-servers/:id/toggle
// @access  Public / Optional Auth
export const toggleServerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await MockServer.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!server) {
      return res.status(404).json({ success: false, message: 'Mock server not found' });
    }

    server.status = server.status === 'active' ? 'paused' : 'active';
    await server.save();

    res.status(200).json({ success: true, data: server });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete mock server
// @route   DELETE /api/mock-servers/:id
// @access  Public / Optional Auth
export const deleteMockServer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await MockServer.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!server) {
      return res.status(404).json({ success: false, message: 'Mock server not found' });
    }

    const srvId = server.customId || server._id.toString();
    await MockRule.deleteMany({ serverId: srvId });
    await server.deleteOne();

    res.status(200).json({ success: true, message: 'Mock server and associated rules deleted' });
  } catch (err) {
    next(err);
  }
};

export default {
  getMockServers,
  getMockServerById,
  createMockServer,
  updateMockServer,
  toggleServerStatus,
  deleteMockServer,
};
