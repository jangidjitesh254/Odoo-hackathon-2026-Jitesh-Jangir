import { getNextActions, getAssetStatusForRequest } from "../../api/maintenance";

import { useState } from "react";
import { Plus, Wrench, User, Calendar } from "lucide-react";

import Modal from "../ui/Modal";
import PriorityBadge from "../ui/PriorityBadge";
import MaintenanceStatusBadge from "../ui/MaintenanceStatusBadge";

import {
  assets,
  maintenanceRequests as initialRequests,
  technicians,
} from "../../api/mockData";

import {
  // whatever functions you use
} from "../../api/maintenance";

export default function Maintenance() {
  const [requests, setRequests] = useState(initialRequests);
  const [assetStatuses, setAssetStatuses] = useState(
    Object.fromEntries(assets.map((a) => [a.id, a.status]))
  );

  const [showModal, setShowModal] = useState(false);
  const [technicianModal, setTechnicianModal] = useState(null); // request being assigned

  const [form, setForm] = useState({
    assetId: assets[0]?.id,
    raisedBy: "",
    issue: "",
    priority: "Medium",
  });

  const handleRaise = () => {
    if (!form.raisedBy || !form.issue) return;
    const asset = assets.find((a) => a.id === form.assetId);
    setRequests([
      ...requests,
      {
        id: Date.now(),
        assetId: asset.id,
        assetTag: asset.tag,
        assetName: asset.name,
        raisedBy: form.raisedBy,
        issue: form.issue,
        priority: form.priority,
        status: "Pending",
        technician: null,
        createdDate: new Date().toISOString().split("T")[0],
      },
    ]);
    setForm({ assetId: assets[0]?.id, raisedBy: "", issue: "", priority: "Medium" });
    setShowModal(false);
  };

  const updateAssetStatus = (assetId, requestStatus) => {
    const newAssetStatus = getAssetStatusForRequest(requestStatus);
    if (newAssetStatus) {
      setAssetStatuses((prev) => ({ ...prev, [assetId]: newAssetStatus }));
    }
  };

  const handleAction = (request, action) => {
    let newStatus = request.status;

    if (action === "Approve") newStatus = "Approved";
    if (action === "Reject") newStatus = "Rejected";
    if (action === "Start Work") newStatus = "In Progress";
    if (action === "Mark Resolved") newStatus = "Resolved";

    if (action === "Assign Technician") {
      setTechnicianModal(request);
      return;
    }

    setRequests(requests.map((r) => (r.id === request.id ? { ...r, status: newStatus } : r)));
    updateAssetStatus(request.assetId, newStatus);
  };

  const confirmTechnician = (technician) => {
    setRequests(
      requests.map((r) =>
        r.id === technicianModal.id ? { ...r, status: "Technician Assigned", technician } : r
      )
    );
    updateAssetStatus(technicianModal.assetId, "Technician Assigned");
    setTechnicianModal(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Maintenance Management</h2>
          <p className="text-sm text-gray-400">Route repairs through approval before work starts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90"
        >
          <Plus size={16} /> Raise Request
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wrench size={16} className="text-primary" />
                  <h3 className="font-semibold text-gray-800">{r.assetTag} · {r.assetName}</h3>
                </div>
                <p className="text-sm text-gray-500">{r.issue}</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={r.priority} />
                <MaintenanceStatusBadge status={r.status} />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1"><User size={12} /> Raised by {r.raisedBy}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {r.createdDate}</span>
              {r.technician && (
                <span className="flex items-center gap-1"><Wrench size={12} /> Technician: {r.technician}</span>
              )}
              <span className="text-gray-500">
                Asset status: <span className="font-medium">{assetStatuses[r.assetId]}</span>
              </span>
            </div>

            {getNextActions(r.status).length > 0 && (
              <div className="flex gap-2">
                {getNextActions(r.status).map((action) => (
                  <button
                    key={action}
                    onClick={() => handleAction(r, action)}
                    className={`text-xs font-medium px-3 py-2 rounded-xl ${
                      action === "Reject"
                        ? "bg-red-50 text-danger hover:bg-red-100"
                        : "bg-primary-light text-primary hover:bg-primary hover:text-white"
                    } transition-colors`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {requests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-400">
            No maintenance requests yet.
          </div>
        )}
      </div>

      {/* Raise Request Modal */}
      {showModal && (
        <Modal title="Raise Maintenance Request" onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            <select
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: Number(e.target.value) })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.tag} · {a.name}</option>
              ))}
            </select>

            <input
              placeholder="Your name"
              value={form.raisedBy}
              onChange={(e) => setForm({ ...form, raisedBy: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            />

            <textarea
              placeholder="Describe the issue"
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              rows={3}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-primary"
            />

            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <button
              onClick={handleRaise}
              className="bg-primary text-white text-sm font-medium py-2.5 rounded-xl mt-2 hover:opacity-90"
            >
              Submit Request
            </button>
          </div>
        </Modal>
      )}

      {/* Assign Technician Modal */}
      {technicianModal && (
        <Modal title={`Assign Technician — ${technicianModal.assetTag}`} onClose={() => setTechnicianModal(null)}>
          <div className="flex flex-col gap-3">
            {technicians.map((t) => (
              <button
                key={t}
                onClick={() => confirmTechnician(t)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary text-left"
              >
                {t}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}