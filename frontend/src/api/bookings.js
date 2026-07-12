// Converts "HH:MM" on a given date into a comparable Date object
function toDateTime(date, time) {
  return new Date(`${date}T${time}`);
}

// Core overlap rule from the PDF spec
export function hasOverlap(resourceId, date, startTime, endTime, bookings, excludeId = null) {
  const newStart = toDateTime(date, startTime);
  const newEnd = toDateTime(date, endTime);

  return bookings.some((b) => {
    if (b.resourceId !== resourceId || b.date !== date) return false;
    if (b.status === "Cancelled") return false;
    if (excludeId && b.id === excludeId) return false;

    const existingStart = toDateTime(b.date, b.startTime);
    const existingEnd = toDateTime(b.date, b.endTime);

    return newStart < existingEnd && newEnd > existingStart;
  });
}

export function getBookingStatus(booking) {
  if (booking.status === "Cancelled") return "Cancelled";
  const now = new Date();
  const start = toDateTime(booking.date, booking.startTime);
  const end = toDateTime(booking.date, booking.endTime);
  if (now < start) return "Upcoming";
  if (now >= start && now <= end) return "Ongoing";
  return "Completed";
}