import Environment from '../models/Environment.js';

// @desc    Get all environments
// @route   GET /api/environments
// @access  Public
export const getEnvironments = async (req, res, next) => {
  try {
    const environments = await Environment.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: environments.length, data: environments });
  } catch (err) {
    next(err);
  }
};

// @desc    Get environment by ID
// @route   GET /api/environments/:id
// @access  Public
export const getEnvironmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const environment = await Environment.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!environment) {
      return res.status(404).json({ success: false, message: 'Environment not found' });
    }
    res.status(200).json({ success: true, data: environment });
  } catch (err) {
    next(err);
  }
};

// @desc    Create environment
// @route   POST /api/environments
// @access  Public / Optional Auth
export const createEnvironment = async (req, res, next) => {
  try {
    const { name, description, baseUrl, color, variables, isDefault, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Environment name is required' });
    }

    const customId = `env_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const environment = await Environment.create({
      customId,
      name: name.trim(),
      description: description || '',
      baseUrl: baseUrl || 'https://api.apiforge.dev/v1',
      color: color || 'indigo',
      isDefault: isDefault || false,
      isActive: isActive || false,
      variables: variables || [],
    });

    res.status(201).json({ success: true, data: environment });
  } catch (err) {
    next(err);
  }
};

// @desc    Update environment
// @route   PUT /api/environments/:id
// @access  Public / Optional Auth
export const updateEnvironment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const environment = await Environment.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!environment) {
      return res.status(404).json({ success: false, message: 'Environment not found' });
    }

    Object.assign(environment, req.body);
    await environment.save();

    res.status(200).json({ success: true, data: environment });
  } catch (err) {
    next(err);
  }
};

// @desc    Set active environment
// @route   PATCH /api/environments/:id/activate
// @access  Public
export const setActiveEnvironment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await Environment.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!target) {
      return res.status(404).json({ success: false, message: 'Environment not found' });
    }

    // Set all others to isActive: false
    await Environment.updateMany({}, { isActive: false });
    target.isActive = true;
    await target.save();

    res.status(200).json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
};

// @desc    Duplicate environment
// @route   POST /api/environments/:id/duplicate
// @access  Public
export const duplicateEnvironment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const source = await Environment.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!source) {
      return res.status(404).json({ success: false, message: 'Source environment not found' });
    }

    const customId = `env_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const cloned = await Environment.create({
      customId,
      name: `${source.name} (Copy)`,
      description: source.description,
      baseUrl: source.baseUrl,
      color: source.color,
      isDefault: false,
      isActive: false,
      variables: source.variables.map((v) => ({
        id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        key: v.key,
        value: v.value,
        isSecret: v.isSecret,
        enabled: v.enabled,
        description: v.description,
      })),
    });

    res.status(201).json({ success: true, data: cloned });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete environment
// @route   DELETE /api/environments/:id
// @access  Public / Optional Auth
export const deleteEnvironment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const count = await Environment.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the only remaining environment' });
    }

    const environment = await Environment.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!environment) {
      return res.status(404).json({ success: false, message: 'Environment not found' });
    }

    const wasActive = environment.isActive;
    await environment.deleteOne();

    // If active was deleted, automatically activate another environment
    if (wasActive) {
      const fallback = await Environment.findOne();
      if (fallback) {
        fallback.isActive = true;
        await fallback.save();
      }
    }

    res.status(200).json({ success: true, message: 'Environment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
  getEnvironments,
  getEnvironmentById,
  createEnvironment,
  updateEnvironment,
  setActiveEnvironment,
  duplicateEnvironment,
  deleteEnvironment,
};
