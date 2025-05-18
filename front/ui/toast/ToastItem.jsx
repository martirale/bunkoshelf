import {
  CheckCircle,
  XCircle,
  Info,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import clsx from "clsx";

export default function ToastItem({ title, description, variant = "default" }) {
  const variants = {
    success: "bg-[#052514]",
    warning: "bg-[#62420e]",
    danger: "bg-[#610726]",
    error: "bg-[#610726]",
    default: "bg-[#292929]",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#17c964]" />,
    warning: <ShieldAlert className="w-5 h-5 text-[#f5a524]" />,
    danger: <TriangleAlert className="w-5 h-5 text-[#f54180]" />,
    error: <XCircle className="w-5 h-5 text-[#f54180]" />,
    default: <Info className="w-5 h-5 text-pearl" />,
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
