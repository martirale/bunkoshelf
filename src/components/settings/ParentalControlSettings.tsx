"use client";

import { useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateGlobalParentalControl } from "@/actions/parental-control";
import Switch from "@/components/ui/Switch";
import { useToast } from "@/components/ToastProvider";
import type { Dictionary, Locale } from "@/lib/types";
import type { ParentalControlMode } from "@/lib/parentalControl";

export default function ParentalControlSettings({ enabled, mode: initialMode, lang, intl }: { enabled: boolean; mode: ParentalControlMode; lang: Locale; intl: Dictionary }) {
  const router = useRouter();
  const [value, setValue] = useState(enabled);
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast()!;
  const labels = intl.settings as Record<string, string>;
  async function update(next: boolean, nextMode = mode) {
    setLoading(true);
    const result = await updateGlobalParentalControl(next, nextMode, lang);
    setLoading(false);
    if (result.success) { setValue(next); setMode(nextMode); router.refresh(); }
    else addToast({ title: intl.alerts.errorTt as string, description: labels.parentalControlUpdateError, variant: "error" });
  }
  return <section className="rounded-lg bg-blackamber p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="flex items-center gap-2 text-base"><ShieldCheckIcon size={20} />{labels.parentalControl}</h3><p className="mt-1 text-neutral-300">{labels.parentalControlGlobalHelp}</p></div><Switch checked={value} disabled={loading} onCheckedChange={(next) => void update(next)} /></div>{value && <fieldset className="mt-4 space-y-3" disabled={loading}><legend className="mb-2 font-bold">{labels.parentalControlGlobalLevel}</legend><label className="grid grid-cols-[auto_1fr] items-start gap-x-3"><input className="mt-1.5" type="radio" checked={mode === "flexible"} onChange={() => void update(true, "flexible")} /><span className="font-bold leading-tight">{labels.parentalControlFlexible}</span><span className="col-start-2 text-sm leading-snug text-neutral-300">{labels.parentalControlGlobalFlexibleHelp}</span></label><label className="grid grid-cols-[auto_1fr] items-start gap-x-3"><input className="mt-1.5" type="radio" checked={mode === "strict"} onChange={() => void update(true, "strict")} /><span className="font-bold leading-tight">{labels.parentalControlStrict}</span><span className="col-start-2 text-sm leading-snug text-neutral-300">{labels.parentalControlGlobalStrictHelp}</span></label></fieldset>}<p className="mt-4 font-bold">{value ? labels.parentalControlGlobalOn : labels.parentalControlGlobalOff}</p></section>;
}
