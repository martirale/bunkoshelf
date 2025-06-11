import {
  CheckCircle,
  XCircle,
  Info,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import clsx from "clsx";

export default function AlertBox({ title, description, variant = "default" }) {
  const variants = {
    success: "bg-[#052514] border-[#052514] hover:border-[#17c964]",
    warning: "bg-[#62420e] border-[#62420e] hover:border-[#f5a524]",
    danger: "bg-[#610726] border-[#610726] hover:border-[#f54180]",
    error: "bg-[#610726] border-[#610726] hover:border-[#f54180]",
    default: "bg-[#292929] border-[#292929] hover:border-pearl",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#17c964]" />,
    warning: <ShieldAlert className="w-5 h-5 text-[#f5a524]" />,
    danger: <TriangleAlert className="w-5 h-5 text-[#f54180]" />,
    error: <XCircle className="w-5 h-5 text-[#f54180]" />,
    default: <Info className="w-5 h-5 text-pearl" />,
  };

  return (
    <>
      <div
        className={clsx(
          "rounded-lg p-4 w-full border transition-all duration-300",
          variants[variant]
        )}
      >
        <div className="flex items-start gap-3">
          <div className="pt-0.5">{icons[variant]}</div>

          <div className="text-left">
            <p className="block text-base font-bold uppercase">{title}</p>
            {description && (
              <span className="block text-base mt-1">{description}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
