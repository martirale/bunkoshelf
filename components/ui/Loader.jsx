import { Loader2Icon } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2Icon size={32} className="animate-spin" />
    </div>
  );
}
