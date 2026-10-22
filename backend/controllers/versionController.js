import ApiVersion from '../models/ApiVersion.js';

// @desc    Get all API versions
// @route   GET /api/versions
// @access  Public
export const getAllVersions = async (req, res, next) => {
  try {
    const versions = await ApiVersion.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: versions.length, data: versions });
  } catch (err) {
    next(err);
  }
};

// @desc    Get version by ID or versionNumber
// @route   GET /api/versions/:id
// @access  Public
export const getVersionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const version = await ApiVersion.findOne({
      $or: [
        { customId: id },
        { versionNumber: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });

    if (!version) {
      return res.status(404).json({ success: false, message: 'API version not found' });
    }
    res.status(200).json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new API version
// @route   POST /api/versions
// @access  Public / Optional Auth
export const createVersion = async (req, res, next) => {
  try {
    const { versionNumber, status, description, releaseNotes, changes, endpoints } = req.body;

    if (!versionNumber || !versionNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Version number is required (e.g. v1, v2)' });
    }

    const cleanVer = versionNumber.trim().toLowerCase();
    const existing = await ApiVersion.findOne({ versionNumber: cleanVer });
    if (existing) {
      return res.status(400).json({ success: false, message: `Version ${versionNumber} already exists` });
    }

    const customId = `ver_${cleanVer}_${Date.now().toString(36)}`;
    const version = await ApiVersion.create({
      customId,
      versionNumber: cleanVer,
      status: status || 'Draft',
      description: description || '',
      releaseNotes: releaseNotes || '',
      changes: changes || [],
      endpoints: endpoints || [],
      author: req.user?.name || 'Alex Rivera',
    });

    res.status(201).json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
};

// @desc    Update API version
// @route   PUT /api/versions/:id
// @access  Public / Optional Auth
export const updateVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const version = await ApiVersion.findOne({
      $or: [
        { customId: id },
        { versionNumber: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });

    if (!version) {
      return res.status(404).json({ success: false, message: 'API version not found' });
    }

    Object.assign(version, req.body);
    await version.save();

    res.status(200).json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete API version
// @route   DELETE /api/versions/:id
// @access  Public / Optional Auth
export const deleteVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const count = await ApiVersion.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the only existing API version' });
    }

    const version = await ApiVersion.findOne({
      $or: [
        { customId: id },
        { versionNumber: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });

    if (!version) {
      return res.status(404).json({ success: false, message: 'API version not found' });
    }

    await version.deleteOne();
    res.status(200).json({ success: true, message: 'API version deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Compare endpoints between two versions (v1 vs v2)
// @route   GET /api/versions/compare/:v1/:v2
// @access  Public
export const compareVersions = async (req, res, next) => {
  try {
    const { v1, v2 } = req.params;
    const ver1 = await ApiVersion.findOne({ versionNumber: v1.toLowerCase() });
    const ver2 = await ApiVersion.findOne({ versionNumber: v2.toLowerCase() });

    if (!ver1 || !ver2) {
      return res.status(404).json({ success: false, message: 'One or both versions to compare not found' });
    }

    const allEndpointsMap = new Map();
    (ver1.endpoints || []).forEach((ep) => {
      const key = `${ep.method}:${ep.endpoint}`;
      allEndpointsMap.set(key, {
        method: ep.method,
        endpoint: ep.endpoint,
        description: ep.description,
        inV1: true,
        inV2: false,
      });
    });

    (ver2.endpoints || []).forEach((ep) => {
      const key = `${ep.method}:${ep.endpoint}`;
      if (allEndpointsMap.has(key)) {
        allEndpointsMap.get(key).inV2 = true;
      } else {
        allEndpointsMap.set(key, {
          method: ep.method,
          endpoint: ep.endpoint,
          description: ep.description,
          inV1: false,
          inV2: true,
        });
      }
    });

    const endpointsList = Array.from(allEndpointsMap.values());
    const comparisonData = {
      v1: ver1.versionNumber,
      v2: ver2.versionNumber,
      endpoints: endpointsList,
      endpointMatrix: endpointsList,
    };

    res.status(200).json({
      success: true,
      data: comparisonData,
      comparison: comparisonData,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAllVersions,
  getVersionById,
  createVersion,
  updateVersion,
  deleteVersion,
  compareVersions,
};
