const STYLES = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-primary-light text-primary",
  Rejected: "bg-red-100 text-danger",
  "Technician Assigned": "bg-blue-100 text-blue-600",
  "In Progress": "bg-orange-100 text-orange-600",
  Resolved: "bg-green-100 text-success",
};

export default function MaintenanceStatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}