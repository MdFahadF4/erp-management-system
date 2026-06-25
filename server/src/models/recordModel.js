import mongoose from 'mongoose';

/**
 * Flexible document schema — mirrors Google Sheet rows.
 * Each document stores column headers as keys (e.g. "Username", "Sold Amount").
 */
function createRecordSchema() {
  return new mongoose.Schema(
    {
      ID: { type: String, required: true, index: true }
    },
    {
      strict: false,
      timestamps: false
    }
  );
}

const modelCache = new Map();

export function getRecordModel(collectionName) {
  const name = String(collectionName || '').trim();
  if (!name) throw new Error('Collection name required');
  if (modelCache.has(name)) return modelCache.get(name);

  const model = mongoose.model(`Record_${name}`, createRecordSchema(), name);
  modelCache.set(name, model);
  return model;
}

export async function findAllRecords(collectionName) {
  const Model = getRecordModel(collectionName);
  const docs = await Model.find({}).lean();
  return docs.map(({ _id, __v, ...rest }) => rest);
}

export async function findRecordById(collectionName, id) {
  const Model = getRecordModel(collectionName);
  return Model.findOne({ ID: String(id) }).lean();
}

export async function insertRecord(collectionName, record) {
  const Model = getRecordModel(collectionName);
  const doc = await Model.create(record);
  const obj = doc.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
}

export async function updateRecordById(collectionName, id, updates) {
  const Model = getRecordModel(collectionName);
  const { _id, __v, ID, ...fields } = updates;
  return Model.findOneAndUpdate(
    { ID: String(id) },
    { $set: fields },
    { new: true, lean: true }
  );
}

export async function deleteRecordById(collectionName, id) {
  const Model = getRecordModel(collectionName);
  return Model.findOneAndDelete({ ID: String(id) }).lean();
}
