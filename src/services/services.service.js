import servicesRepository from '../repositories/services.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const FIELDS = ['name', 'description', 'duration', 'price', 'category', 'available'];

const isMissing = (value) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

const pickFields = (data) =>
  Object.fromEntries(
    FIELDS.filter((field) => data[field] !== undefined).map((field) => [field, data[field]])
  );

export class ServicesService {
  constructor(repository) {
    this.repository = repository;
  }

  async getServices(filters = {}) {
    const { category, available } = filters;
    const query = {};

    if (category !== undefined) query.category = category.toLowerCase();
    if (available !== undefined) query.available = available;

    return this.repository.getAll(query);
  }

  async getAvailability() {
    const services = await this.repository.getAll();
    const available = services.filter((service) => service.available);
    const unavailable = services.filter((service) => !service.available);
    const groups = new Map();

    for (const service of available) {
      if (!groups.has(service.category)) groups.set(service.category, []);
      groups.get(service.category).push(service);
    }

    const categories = [...groups.entries()]
      .map(([category, items]) => ({
        category,
        services: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.category.localeCompare(b.category));

    return {
      totalServices: services.length,
      totalAvailable: available.length,
      categories,
      unavailable: unavailable.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async getServiceById(id) {
    const service = await this.repository.getById(id);
    if (!service) throw new NotFoundError(`No existe un servicio con id ${id}`);
    return service;
  }

  async createService(serviceData) {
    const data = pickFields(serviceData ?? {});
    const missing = FIELDS.filter((field) => isMissing(data[field]));

    if (missing.length > 0) {
      throw new ValidationError(`Servicio incompleto. Faltan los campos: ${missing.join(', ')}`);
    }

    return this.repository.create(data);
  }

  async updateService(id, updatedData) {
    await this.getServiceById(id);

    const changes = pickFields(updatedData ?? {});
    const fields = Object.keys(changes);

    if (fields.length === 0) {
      throw new ValidationError(`No se enviaron campos para actualizar. Campos permitidos: ${FIELDS.join(', ')}`);
    }

    const empty = fields.filter((field) => isMissing(changes[field]));

    if (empty.length > 0) {
      throw new ValidationError(`Los campos no pueden estar vacíos: ${empty.join(', ')}`);
    }

    return this.repository.update(id, changes);
  }

  async deleteService(id) {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError(`No existe un servicio con id ${id}`);
    return deleted;
  }
}

export default new ServicesService(servicesRepository);
