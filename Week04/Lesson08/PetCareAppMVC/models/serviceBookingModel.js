const db = require('../config/db');

function createPendingBooking(ownerId, petId, serviceId, bookingDate, callback) {
  db.getConnection((connectErr, connection) => {
    if (connectErr) return callback(connectErr);

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        return callback(txErr);
      }

      const petCheckSql = 'SELECT id FROM pets WHERE id = ? AND owner_id = ?';
      connection.query(petCheckSql, [petId, ownerId], (petErr, petRows) => {
        if (petErr) {
          return connection.rollback(() => {
            connection.release();
            callback(petErr);
          });
        }

        if (!petRows || petRows.length === 0) {
          return connection.rollback(() => {
            connection.release();
            callback(null, null);
          });
        }

        const serviceSql = 'SELECT id, price FROM services WHERE id = ? AND is_active = 1';
        connection.query(serviceSql, [serviceId], (serviceErr, serviceRows) => {
          if (serviceErr) {
            return connection.rollback(() => {
              connection.release();
              callback(serviceErr);
            });
          }

          if (!serviceRows || serviceRows.length === 0) {
            return connection.rollback(() => {
              connection.release();
              callback(null, null);
            });
          }

          const service = serviceRows[0];
          const bookingSql = `
            INSERT INTO service_bookings (pet_id, service_id, booking_status, booked_price, booking_date)
            VALUES (?, ?, 'pending', ?, ?)
          `;

          connection.query(bookingSql, [petId, service.id, service.price, bookingDate], (bookingErr, bookingResult) => {
            if (bookingErr) {
              return connection.rollback(() => {
                connection.release();
                callback(bookingErr);
              });
            }

            const bookingId = bookingResult.insertId;
            const paymentSql = `
              INSERT INTO payments (booking_id, amount, payment_status, payment_reference)
              VALUES (?, ?, 'pending', NULL)
            `;

            connection.query(paymentSql, [bookingId, service.price], (paymentErr, paymentResult) => {
              if (paymentErr) {
                return connection.rollback(() => {
                  connection.release();
                  callback(paymentErr);
                });
              }

              connection.commit((commitErr) => {
                if (commitErr) {
                  return connection.rollback(() => {
                    connection.release();
                    callback(commitErr);
                  });
                }

                connection.release();
                callback(null, {
                  bookingId,
                  paymentId: paymentResult.insertId
                });
              });
            });
          });
        });
      });
    });
  });
}

function getBookingsByOwner(ownerId, callback) {
  const sql = `
    SELECT
      sb.id AS booking_id,
      DATE_FORMAT(sb.booking_date, '%Y-%m-%d') AS booking_date,
      p.name AS pet_name,
      s.name AS service_name,
      sb.booked_price,
      sb.booking_status,
      pay.payment_status
    FROM service_bookings sb
    JOIN pets p ON sb.pet_id = p.id
    JOIN services s ON sb.service_id = s.id
    LEFT JOIN payments pay ON pay.booking_id = sb.id
    WHERE p.owner_id = ?
    ORDER BY sb.created_at DESC, sb.id DESC
  `;

  db.query(sql, [ownerId], callback);
}

module.exports = {
  createPendingBooking,
  getBookingsByOwner
};
