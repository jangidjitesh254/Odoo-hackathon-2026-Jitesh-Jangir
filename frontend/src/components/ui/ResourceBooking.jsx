import { useState } from "react";
import { Plus, AlertTriangle, X } from "lucide-react";
import Modal from "./Modal";
import BookingStatusBadge from "./BookingStatusBadge";
import { resources, bookings as initialBookings } from "../../api/mockData";
import { hasOverlap, getBookingStatus } from "../../api/bookings";

const todayStr = new Date().toISOString().split("T")[0];

export default function ResourceBooking() {
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedResource, setSelectedResource] = useState(resources[0].id);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    resourceId: resources[0].id,
    bookedBy: "",
    date: todayStr,
    startTime: "09:00",
    endTime: "10:00",
  });

  const dayBookings = bookings
    .filter((b) => b.resourceId === selectedResource && b.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleBook = () => {
    if (!form.bookedBy) {
      setError("Please enter who is booking.");
      return;
    }
    if (form.endTime <= form.startTime) {
      setError("End time must be after start time.");
      return;
    }

    const conflict = hasOverlap(form.resourceId, form.date, form.startTime, form.endTime, bookings);
    if (conflict) {
      setError("This slot overlaps with an existing booking. Try a different time.");
      return;
    }

    const resource = resources.find((r) => r.id === Number(form.resourceId));
    setBookings([
      ...bookings,
      {
        id: Date.now(),
        resourceId: Number(form.resourceId),
        resourceName: resource.name,
        bookedBy: form.bookedBy,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        status: "Active",
      },
    ]);
    setError("");
    setShowModal(false);
    setSelectedResource(Number(form.resourceId));
    setSelectedDate(form.date);
  };

  const cancelBooking = (id) => {
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Resource Booking</h2>
          <p className="text-sm text-gray-400">Book shared resources by time slot — no overlaps allowed</p>
        </div>
        <button
          onClick={() => { setError(""); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90"
        >
          <Plus size={16} /> Book Resource
        </button>
      </div>

      {/* Resource + date selector */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedResource}
          onChange={(e) => setSelectedResource(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none text-gray-600"
        >
          {resources.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none text-gray-600"
        />
      </div>

      {/* Day timeline for selected resource */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {resources.find((r) => r.id === selectedResource)?.name} — {selectedDate}
        </h3>

        {dayBookings.length === 0 ? (
          <p className="text-sm text-gray-400">No bookings for this day. Fully available.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {dayBookings.map((b) => {
              const status = getBookingStatus(b);
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    status === "Cancelled" ? "bg-gray-50 opacity-60" : "bg-primary-light"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {b.startTime} – {b.endTime}
                    </p>
                    <p className="text-xs text-gray-500">Booked by {b.bookedBy}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookingStatusBadge status={status} />
                    {status === "Upcoming" && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="flex items-center gap-1 text-xs font-medium text-danger hover:underline"
                      >
                        <X size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All upcoming bookings across resources */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">All Bookings</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Resource</th>
              <th className="pb-3 font-medium">Booked By</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3 font-medium text-gray-800">{b.resourceName}</td>
                <td className="py-3 text-gray-600">{b.bookedBy}</td>
                <td className="py-3 text-gray-600">{b.date}</td>
                <td className="py-3 text-gray-600">{b.startTime} – {b.endTime}</td>
                <td className="py-3"><BookingStatusBadge status={getBookingStatus(b)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <Modal title="Book Resource" onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 p-3 rounded-xl text-sm text-danger">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <select
              value={form.resourceId}
              onChange={(e) => setForm({ ...form, resourceId: Number(e.target.value) })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <input
              placeholder="Booked by (your name)"
              value={form.bookedBy}
              onChange={(e) => setForm({ ...form, bookedBy: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none w-full"
                />
              </div>
            </div>

            <button
              onClick={handleBook}
              className="bg-primary text-white text-sm font-medium py-2.5 rounded-xl mt-2 hover:opacity-90"
            >
              Confirm Booking
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}