import bookingsRepository from '../repositories/bookings.repository.js';
import servicesRepository from '../repositories/services.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const REQUIRED_FIELDS = ['clientName', 'clientEmail', 'date', 'time'];
const STATUSES = ['pending', 'confirmed', 'cancelled'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const isMissing = (value) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

const isValidDate = (value) => {
  if (!DATE_REGEX.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const validateBooking = (data) => {
  const missing = REQUIRED_FIELDS.filter((field) => isMissing(data[field]));

  if (missing.length > 0) {
    throw new ValidationError(`Reserva incompleta. Faltan los campos: ${missing.join(', ')}`);
  }

  const errors = [];

  if (typeof data.clientName !== 'string') errors.push('clientName debe ser un texto');
  if (typeof data.clientEmail !== 'string' || !EMAIL_REGEX.test(data.clientEmail.trim())) {
    errors.push('clientEmail debe ser un email válido');
  }
  if (typeof data.date !== 'string' || !isValidDate(data.date)) {
    errors.push('date debe tener el formato YYYY-MM-DD y ser una fecha real');
  }
  if (typeof data.time !== 'string' || !TIME_REGEX.test(data.time)) {
    errors.push('time debe tener el formato HH:MM (24 horas)');
  }
  if (data.status !== undefined && !STATUSES.includes(data.status)) {
    errors.push(`status solo acepta: ${STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '));
  }
};

export class BookingsService {
  constructor(bookingsRepo, servicesRepo) {
    this.bookingsRepository = bookingsRepo;
    this.servicesRepository = servicesRepo;
  }

  async createBooking(bookingData) {
    const data = bookingData ?? {};
    validateBooking(data);

    return this.bookingsRepository.create({
      clientName: data.clientName.trim(),
      clientEmail: data.clientEmail.trim().toLowerCase(),
      date: data.date,
      time: data.time,
      status: data.status ?? 'pending',
      services: [],
    });
  }

  async getBookingById(id) {
    const booking = await this.bookingsRepository.getById(id);
    if (!booking) throw new NotFoundError(`No existe una reserva con id ${id}`);
    return booking;
  }

  async addServiceToBooking(bookingId, serviceId) {
    const booking = await this.getBookingById(bookingId);
    const service = await this.servicesRepository.getById(serviceId);

    if (!service) throw new NotFoundError(`No existe un servicio con id ${serviceId}`);
    if (!service.available) {
      throw new ValidationError(`El servicio ${serviceId} no está disponible para reservar`);
    }

    const exists = booking.services.some((item) => item.service === service.id);

    const services = exists
      ? booking.services.map((item) =>
          item.service === service.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      : [...booking.services, { service: service.id, quantity: 1 }];

    return this.bookingsRepository.update(bookingId, { services });
  }
}

export default new BookingsService(bookingsRepository, servicesRepository);
