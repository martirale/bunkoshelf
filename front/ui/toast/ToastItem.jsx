export default function ToastItem({ title, description, variant = "default" }) {
  const variants = {
    success: "border-green-300",
    error: "border-red-400",
    default: "border-pearl",
  };

  return (
    <div
      className={`bg-blackamber border rounded-lg p-4 w-80 text-center animate-fade-in ${variants[variant]}`}
    >
      <strong className="block text-base font-bold uppercase">{title}</strong>
      <span className="block text-base mt-1">{description}</span>
    </div>
  );
}
