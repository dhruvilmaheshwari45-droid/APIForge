import MockRule from '../models/MockRule.js';

// @desc    Get mock rules (optionally filter by serverId or endpointId)
// @route   GET /api/mock-rules
// @access  Public
export const getMockRules = async (req, res, next) => {
  try {
    const { serverId, endpointId } = req.query;
    const filter = {};
    if (serverId) filter.serverId = serverId;
    if (endpointId) filter.endpointId = endpointId;

    const rules = await MockRule.find(filter).sort({ priority: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: rules.length, data: rules });
  } catch (err) {
    next(err);
  }
};

// @desc    Get mock rule by ID
// @route   GET /api/mock-rules/:id
// @access  Public
export const getMockRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await MockRule.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Mock rule not found' });
    }
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

// @desc    Create mock rule
// @route   POST /api/mock-rules
// @access  Public / Optional Auth
export const createMockRule = async (req, res, next) => {
  try {
    const { serverId, endpointId, name, description, priority, conditions, response, enabled } = req.body;

    if (!serverId || !name) {
      return res.status(400).json({ success: false, message: 'serverId and name are required' });
    }

    const customId = `mrule_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const rule = await MockRule.create({
      customId,
      serverId,
      endpointId,
      name: name.trim(),
      description: description || '',
      priority: priority !== undefined ? priority : 1,
      enabled: enabled !== undefined ? enabled : true,
      conditions: conditions || [],
      response: response || { statusCode: 200, bodyType: 'json', body: '{}', headers: [], delayMs: 0 },
    });

    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

// @desc    Update mock rule
// @route   PUT /api/mock-rules/:id
// @access  Public / Optional Auth
export const updateMockRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await MockRule.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Mock rule not found' });
    }

    Object.assign(rule, req.body);
    await rule.save();

    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle rule enabled status
// @route   PATCH /api/mock-rules/:id/toggle
// @access  Public / Optional Auth
export const toggleMockRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await MockRule.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Mock rule not found' });
    }

    rule.enabled = !rule.enabled;
    await rule.save();

    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete mock rule
// @route   DELETE /api/mock-rules/:id
// @access  Public / Optional Auth
export const deleteMockRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await MockRule.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Mock rule not found' });
    }

    await rule.deleteOne();
    res.status(200).json({ success: true, message: 'Mock rule deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
  getMockRules,
  getMockRuleById,
  createMockRule,
  updateMockRule,
  toggleMockRule,
  deleteMockRule,
};
