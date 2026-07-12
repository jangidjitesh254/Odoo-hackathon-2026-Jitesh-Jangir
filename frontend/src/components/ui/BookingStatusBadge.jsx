const STYLES = {
  Upcoming: "bg-primary-light text-primary",
  Ongoing: "bg-green-100 text-success",
  Completed: "bg-gray-100 text-gray-500",
  Cancelled: "bg-red-100 text-danger",
};

export default function BookingStatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[status] || STYLES.Completed}`}>
      {status}
    </span>
  );
}