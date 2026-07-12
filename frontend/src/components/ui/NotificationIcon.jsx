import { AlertTriangle, CheckCircle2, ArrowRightLeft, ClipboardCheck, Clock } from "lucide-react";

const CONFIG = {
  danger: { icon: AlertTriangle, bg: "bg-red-100", color: "text-danger" },
  success: { icon: CheckCircle2, bg: "bg-green-100", color: "text-success" },
  primary: { icon: ArrowRightLeft, bg: "bg-primary-light", color: "text-primary" },
  warning: { icon: ClipboardCheck, bg: "bg-yellow-100", color: "text-yellow-600" },
};

export default function NotificationIcon({ severity }) {
  const { icon: Icon, bg, color } = CONFIG[severity] || CONFIG.primary;
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
      <Icon size={16} />
    </div>
  );
}