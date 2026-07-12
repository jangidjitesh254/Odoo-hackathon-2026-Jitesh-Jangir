export const departments = ["IT", "Facilities", "IT Support"];

export const categories = ["Electronics", "Furniture", "Vehicles"];

export let assets = [
  {
    id: 1,
    tag: "AF-0001",
    name: "Dell Laptop 14",
    category: "Electronics",
    serialNumber: "SN-88213",
    acquisitionDate: "2025-02-10",
    acquisitionCost: 65000,
    condition: "Good",
    location: "Bangalore HQ",
    department: "IT",
    status: "Allocated",
    bookable: false,
    holder: "Priya Sharma",
  },
  {
    id: 2,
    tag: "AF-0002",
    name: "Conference Room B2",
    category: "Furniture",
    serialNumber: "-",
    acquisitionDate: "2024-11-01",
    acquisitionCost: 0,
    condition: "Good",
    location: "Bangalore HQ, Floor 3",
    department: "Facilities",
    status: "Available",
    bookable: true,
    holder: null,
  },
  {
    id: 3,
    tag: "AF-0003",
    name: "Projector Epson X200",
    category: "Electronics",
    serialNumber: "SN-44120",
    acquisitionDate: "2023-06-15",
    acquisitionCost: 32000,
    condition: "Fair",
    location: "Bangalore HQ",
    department: "IT",
    status: "Under Maintenance",
    bookable: true,
    holder: null,
  },
  {
    id: 4,
    tag: "AF-0004",
    name: "Company Vehicle - Swift Dzire",
    category: "Vehicles",
    serialNumber: "KA-01-AB-1234",
    acquisitionDate: "2022-09-01",
    acquisitionCost: 850000,
    condition: "Good",
    location: "Bangalore HQ Parking",
    department: "Facilities",
    status: "Reserved",
    bookable: true,
    holder: null,
  },
];

export const allocationHistory = {
  1: [
    { event: "Allocated to Priya Sharma", date: "2025-03-01" },
    { event: "Returned by Rahul Verma", date: "2025-02-28" },
    { event: "Allocated to Rahul Verma", date: "2025-02-11" },
  ],
};

export const maintenanceHistory = {
  3: [
    { event: "Maintenance approved - Lamp replacement", date: "2026-07-05" },
    { event: "Maintenance requested - Dim projection", date: "2026-07-02" },
  ],
};

export const employees = [
  { id: 1, name: "Priya Sharma", department: "IT" },
  { id: 2, name: "Rahul Verma", department: "Facilities" },
  { id: 3, name: "Amit Kumar", department: "IT Support" },
];

export let allocations = [
  {
    id: 1,
    assetId: 1,
    assetTag: "AF-0001",
    assetName: "Dell Laptop 14",
    holderType: "Employee",
    holderName: "Priya Sharma",
    allocatedDate: "2025-03-01",
    expectedReturnDate: "2026-07-15",
    status: "Active", // Active | Returned
  },
];

export const transferRequests = [
  // { id, assetId, fromHolder, toHolder, status: "Requested" | "Approved" | "Re-allocated" }
];

export const resources = [
  { id: 1, name: "Conference Room B2", type: "Room" },
  { id: 2, name: "Company Vehicle - Swift Dzire", type: "Vehicle" },
  { id: 3, name: "Projector Epson X200", type: "Equipment" },
];

export let bookings = [
  {
    id: 1,
    resourceId: 1,
    resourceName: "Conference Room B2",
    bookedBy: "Priya Sharma",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    status: "Active",
  },
];

export const notifications = [
  { id: 1, type: "Overdue Return Alert", message: "Laptop AF-0001 is overdue for return by Priya Sharma", time: "2026-07-12 09:15", read: false, severity: "danger" },
  { id: 2, type: "Booking Confirmed", message: "Conference Room B2 booked 9:00–10:00 today", time: "2026-07-12 08:40", read: false, severity: "success" },
  { id: 3, type: "Maintenance Approved", message: "Maintenance approved for Projector Epson X200", time: "2026-07-11 17:20", read: true, severity: "primary" },
  { id: 4, type: "Transfer Approved", message: "Dell Laptop 14 transferred to Rahul Verma", time: "2026-07-11 14:05", read: true, severity: "primary" },
  { id: 5, type: "Audit Discrepancy Flagged", message: "Projector AF-0003 marked Damaged during Q3 Audit Cycle", time: "2026-07-10 11:30", read: true, severity: "warning" },
  { id: 6, type: "Booking Reminder", message: "Your booking for Swift Dzire starts in 30 minutes", time: "2026-07-10 08:30", read: true, severity: "primary" },
];

export const activityLogs = [
  { id: 1, actor: "Priya Sharma", action: "Requested transfer", target: "Dell Laptop 14 (AF-0001)", time: "2026-07-12 09:20" },
  { id: 2, actor: "Admin", action: "Promoted employee to Asset Manager", target: "Amit Kumar", time: "2026-07-12 09:05" },
  { id: 3, actor: "Rahul Verma", action: "Booked resource", target: "Conference Room B2 (9:00–10:00)", time: "2026-07-12 08:40" },
  { id: 4, actor: "Asset Manager", action: "Approved maintenance request", target: "Projector Epson X200 (AF-0003)", time: "2026-07-11 17:20" },
  { id: 5, actor: "Asset Manager", action: "Approved transfer", target: "Dell Laptop 14 (AF-0001) → Rahul Verma", time: "2026-07-11 14:05" },
  { id: 6, actor: "Auditor - Amit Kumar", action: "Flagged discrepancy", target: "Projector AF-0003 - Damaged", time: "2026-07-10 11:30" },
  { id: 7, actor: "Admin", action: "Created department", target: "IT Support", time: "2026-07-09 10:00" },
];