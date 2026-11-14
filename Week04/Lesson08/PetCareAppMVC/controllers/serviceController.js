const Pet = require('../models/petModel');
const Service = require('../models/serviceModel');
const Booking = require('../models/serviceBookingModel');

function getTodayLocalIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parsePositiveInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function isValidBookingDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date >= startOfToday;
}

function listServices(req, res) {
  const ownerId = req.session.user.id;

  Pet.getByOwner(ownerId, (petErr, pets) => {
    if (petErr) return res.status(500).send('Unable to load pets.');

    Service.getActiveServices((serviceErr, services) => {
      if (serviceErr) return res.status(500).send('Unable to load services.');

      let selectedPetId = '';
      const requestedPetId = req.query.petId;

      if (requestedPetId !== undefined && requestedPetId !== null && requestedPetId !== '') {
        const isOwned = pets.some((pet) => String(pet.id) === String(requestedPetId));
        if (isOwned) selectedPetId = String(requestedPetId);
      }

      return res.render('services', {
        pets,
        services,
        selectedPetId,
        today: getTodayLocalIso(),
        messages: req.flash('success'),
        errors: req.flash('error'),
        session: req.session
      });
    });
  });
}

function createBooking(req, res) {
  const ownerId = req.session.user.id;
  const petId = parsePositiveInt(req.body.petId);
  const serviceId = parsePositiveInt(req.body.serviceId);
  const bookingDate = req.body.bookingDate;

  if (petId === null || serviceId === null || !isValidBookingDate(bookingDate)) {
    req.flash('error', 'Choose a pet, service, and valid booking date.');
    return res.redirect('/services');
  }

  Booking.createPendingBooking(ownerId, petId, serviceId, bookingDate, (err, result) => {
    if (err) {
      console.error('Booking creation failed:', err);
      req.flash('error', 'Unable to create the booking. Please try again.');
      return res.redirect('/services');
    }

    if (!result) {
      req.flash('error', 'That pet or service is unavailable for booking.');
      return res.redirect('/services');
    }

    req.flash('success', 'Booking created. Payment is pending; no payment has been processed.');
    return res.redirect('/bookings');
  });
}

function listBookings(req, res) {
  const ownerId = req.session.user.id;

  Booking.getBookingsByOwner(ownerId, (err, bookings) => {
    if (err) {
      console.error('Booking history load failed:', err);
      return res.status(500).send('Unable to load booking history.');
    }

    return res.render('bookings', {
      bookings,
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

module.exports = {
  listServices,
  createBooking,
  listBookings
};
