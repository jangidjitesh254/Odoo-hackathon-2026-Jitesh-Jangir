const STYLES = {
  Low: "bg-gray-100 text-gray-500",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-danger",
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[priority] || STYLES.Low}`}>
      {priority}
    </span>
  );
}