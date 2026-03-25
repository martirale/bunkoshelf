import {
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

type AlertVariant = "success" | "warning" | "danger" | "error" | "default";

interface AlertBoxProps {
  title: string;
  description?: ReactNode;
  variant?: AlertVariant;
}

const variants: Record<AlertVariant, string> = {
  success: "bg-[#052514] border-[#052514] hover:border-[#17c964]",
  warning: "bg-[#62420e] border-[#62420e] hover:border-[#f5a524]",
  danger: "bg-[#610726] border-[#610726] hover:border-[#f54180]",
  error: "bg-[#610726] border-[#610726] hover:border-[#f54180]",
  default: "bg-[#292929] border-[#292929] hover:border-pearl",
};

const icons: Record<AlertVariant, ReactNode> = {
  success: <CheckCircleIcon size={20} className="text-[#17c964]" />,
  warning: <ShieldAlertIcon size={20} className="text-[#f5a524]" />,
  danger: <TriangleAlertIcon size={20} className="text-[#f54180]" />,
  error: <XCircleIcon size={20} className="text-[#f54180]" />,
  default: <InfoIcon size={20} className="text-pearl" />,
};

export default function AlertBox({
  title,
  description,
  variant = "default",
}: AlertBoxProps) {
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
