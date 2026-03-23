import {
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import clsx from "clsx";

export default function ToastItem({ title, description, variant = "default" }) {
  const variants = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    error: "bg-danger",
    default: "bg-default",
  };

  const icons = {
    success: <CheckCircleIcon size={20} className="text-success-alt" />,
    warning: <ShieldAlertIcon size={20} className="text-warning-alt" />,
    danger: <TriangleAlertIcon size={20} className="text-danger-alt" />,
    error: <XCircleIcon size={20} className="text-danger-alt" />,
    default: <InfoIcon size={20} className="text-pearl" />,
  };

  return (
    <div className={clsx("rounded-lg p-4 w-full", variants[variant])}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{icons[variant]}</div>

        <div className="text-left">
          <p className="block text-base uppercase">{title}</p>
          {description && (
            <span className="block text-base mt-1">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}
