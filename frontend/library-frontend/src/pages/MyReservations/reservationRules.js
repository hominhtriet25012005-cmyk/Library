const activeStatuses = ["PENDING", "AVAILABLE"];

export const canCreateReservation = (book) =>
  book?.active === true && book.availableCopies === 0;

export const canCancelReservation = (reservation) =>
  activeStatuses.includes(reservation.status) &&
  reservation.canBeCancelled === true;

export const filterReservations = (reservations, tab) => {
  if (tab === "pending" || tab === "queueing")
    return reservations.filter((item) => item.status === "PENDING");
  if (tab === "available" || tab === "ready")
    return reservations.filter((item) => item.status === "AVAILABLE");
  if (tab === "active")
    return reservations.filter((item) => activeStatuses.includes(item.status));
  if (tab === "past")
    return reservations.filter((item) => !activeStatuses.includes(item.status));
  return reservations;
};

export const reservationCounts = (reservations) => ({
  total: reservations.length,
  active: reservations.filter((item) => activeStatuses.includes(item.status))
    .length,
  available: reservations.filter((item) => item.status === "AVAILABLE").length,
});
