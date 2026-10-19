import ServiceModel from '../models/service.model.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const isValidId = (id) => typeof id === 'string' && OBJECT_ID_REGEX.test(id);

const toService = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export default class ServicesDAO {
  async getAll(filter = {}) {
    const services = await ServiceModel.find(filter).lean();
    return services.map(toService);
  }

  async getById(id) {
    if (!isValidId(id)) return null;
    return toService(await ServiceModel.findById(id).lean());
  }

  async create(data) {
    const created = await ServiceModel.create(data);
    return toService(created.toObject());
  }

  async update(id, data) {
    if (!isValidId(id)) return null;
    const updated = await ServiceModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
    return toService(updated);
  }

  async delete(id) {
    if (!isValidId(id)) return null;
    return toService(await ServiceModel.findByIdAndDelete(id).lean());
  }
}
