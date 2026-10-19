import servicesService from '../services/services.service.js';
import { emitEvent } from '../sockets/socket.js';
import { ValidationError } from '../utils/errors.js';

const parseFilters = (query) => {
  const { category, available } = query;
  const filters = {};

  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim() === '') {
      throw new ValidationError('El filtro category debe ser un texto no vacío');
    }
    filters.category = category.trim();
  }

  if (available !== undefined) {
    if (available !== 'true' && available !== 'false') {
      throw new ValidationError('El filtro available solo acepta los valores true o false');
    }
    filters.available = available === 'true';
  }

  return filters;
};

const notifyChange = async (event, payload) => {
  try {
    emitEvent(event, payload);
    emitEvent('availability:updated', await servicesService.getAvailability());
  } catch (error) {
    console.error(`No se pudo notificar el evento ${event}: ${error.message}`);
  }
};

export const getServices = async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const services = await servicesService.getServices(filters);
    return res.status(200).json({ status: 'success', payload: services });
  } catch (error) {
    return next(error);
  }
};

export const getServiceById = async (req, res, next) => {
  try {
    const service = await servicesService.getServiceById(req.params.sid);
    return res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    return next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const service = await servicesService.createService(req.body);
    await notifyChange('service:created', service);
    return res.status(201).json({ status: 'success', payload: service });
  } catch (error) {
    return next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const service = await servicesService.updateService(req.params.sid, req.body);
    await notifyChange('service:updated', service);
    return res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    return next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const service = await servicesService.deleteService(req.params.sid);
    await notifyChange('service:deleted', { id: service.id });
    return res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    return next(error);
  }
};
