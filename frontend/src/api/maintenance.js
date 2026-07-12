export const WORKFLOW_STEPS = ["Pending", "Approved", "Technician Assigned", "In Progress", "Resolved"];

export function getNextActions(status) {
  switch (status) {
    case "Pending":
      return ["Approve", "Reject"];
    case "Approved":
      return ["Assign Technician"];
    case "Technician Assigned":
      return ["Start Work"];
    case "In Progress":
      return ["Mark Resolved"];
    default:
      return [];
  }
}

export function getAssetStatusForRequest(requestStatus) {
  if (requestStatus === "Resolved" || requestStatus === "Rejected") return "Available";
  if (["Approved", "Technician Assigned", "In Progress"].includes(requestStatus)) return "Under Maintenance";
  return null;
}