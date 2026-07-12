import { useState } from "react";
import { Bell, ListChecks, CheckCheck } from "lucide-react";
import NotificationIcon from "../ui/NotificationIcon";
import {
  notifications as initialNotifications,
  activityLogs,
} from "../../api/mockData";

const TABS = ["Notifications", "Activity Log"];

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("Notifications");
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Activity Logs & Notifications</h2>
          <p className="text-sm text-gray-400">Stay updated without digging for it</p>
        </div>
        {activeTab === "Notifications" && unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 w-fit shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab === "Notifications" ? <Bell size={15} /> : <ListChecks size={15} />}
            {tab}
            {tab === "Notifications" && unreadCount > 0 && (
              <span className={`text-xs font-bold px-1.5 rounded-full ${activeTab === tab ? "bg-white text-primary" : "bg-primary text-white"}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "Notifications" && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400">No notifications.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    n.read ? "hover:bg-gray-50" : "bg-primary-light/40 hover:bg-primary-light/60"
                  }`}
                >
                  <NotificationIcon severity={n.severity} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">{n.type}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-gray-500">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Activity Log" && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Actor</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Target</th>
                <th className="pb-3 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-gray-800">{log.actor}</td>
                  <td className="py-3 text-gray-600">{log.action}</td>
                  <td className="py-3 text-gray-600">{log.target}</td>
                  <td className="py-3 text-gray-400 text-right">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}