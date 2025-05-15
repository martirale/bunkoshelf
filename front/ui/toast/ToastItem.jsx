import { CheckCircle, XCircle, Info } from "lucide-react";

export default function ToastItem({ title, description, variant = "default" }) {
  const variants = {
    success: "border-green-300",
    error: "border-red-400",
    default: "border-pearl",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-300" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    default: <Info className="w-5 h-5 text-pearl" />,
  };

  return (
    <div
      className={`bg-blackamber border rounded-lg p-4 w-80 animate-fade-in ${variants[variant]}`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{icons[variant]}</div>

        <div className="text-left">
          <strong className="block text-base">{title}</strong>
          {description && (
            <span className="block text-base mt-1">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}
