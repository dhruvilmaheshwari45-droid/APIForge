import Collection from '../models/Collection.js';
import API from '../models/API.js';

// @desc    Get all collections
// @route   GET /api/collections
// @access  Public / Optional Auth
export const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    const endpoints = await API.find({}, 'collectionId');

    // Dynamically compute endpointsCount
    const mapped = collections.map((c) => {
      const obj = c.toJSON();
      const count = endpoints.filter(
        (ep) => ep.collectionId === obj.id || ep.collectionId === c.customId || ep.collectionId === c._id.toString()
      ).length;
      return { ...obj, endpointsCount: count };
    });

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

// @desc    Get collection by ID (supports customId or mongo _id)
// @route   GET /api/collections/:id
// @access  Public
export const getCollectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let collection = await Collection.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const colObj = collection.toJSON();
    const endpoints = await API.find({
      $or: [{ collectionId: colObj.id }, { collectionId: id }, { collectionId: collection._id.toString() }],
    });

    res.status(200).json({
      success: true,
      data: { ...colObj, endpoints },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create collection
// @route   POST /api/collections
// @access  Public / Optional Auth
export const createCollection = async (req, res, next) => {
  try {
    const { name, description, baseUrl, category, version, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
    }

    const customId = `col_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const collection = await Collection.create({
      customId,
      name: name.trim(),
      description: description ? description.trim() : '',
      baseUrl: baseUrl ? baseUrl.trim() : 'https://api.apiforge.dev/v1',
      category: category || 'General Services',
      version: version || 'v1.0.0',
      status: status || 'active',
      endpointsCount: 0,
    });

    res.status(201).json({ success: true, data: collection.toJSON() });
  } catch (err) {
    next(err);
  }
};

// @desc    Update collection
// @route   PUT /api/collections/:id
// @access  Public / Optional Auth
export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    let collection = await Collection.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    Object.assign(collection, req.body);
    await collection.save();

    res.status(200).json({ success: true, data: collection.toJSON() });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete collection & its associated endpoints
// @route   DELETE /api/collections/:id
// @access  Public / Optional Auth
export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const colId = collection.customId || collection._id.toString();
    await API.deleteMany({ collectionId: colId });
    await collection.deleteOne();

    res.status(200).json({ success: true, message: 'Collection and associated endpoints deleted' });
  } catch (err) {
    next(err);
  }
};

export default {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};
