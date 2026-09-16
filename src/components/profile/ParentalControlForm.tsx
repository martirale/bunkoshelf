"use client";

import { useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { updatePersonalParentalControl } from "@/actions/parental-control";
import Switch from "@/components/ui/Switch";
import { useToast } from "@/components/ToastProvider";
import type { Dictionary, Locale, Session } from "@/lib/types";
import { isAdult } from "@/lib/parentalControl";
import type { ParentalControlMode } from "@/lib/parentalControl";

export default function ParentalControlForm({ user, globallyEnabled, globalMode, lang, intl }: { user: Session; globallyEnabled: boolean; globalMode: ParentalControlMode; lang: Locale; intl: Dictionary }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(user.parentalControlEnabled);
  const [mode, setMode] = useState(user.parentalControlMode);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast()!;
  const profile = intl.profile as Record<string, string>;
  const adult = isAdult(user);
  const editable = globallyEnabled && adult;
  async function save(nextEnabled = enabled, nextMode = mode) {
    setLoading(true);
    const result = await updatePersonalParentalControl({ enabled: nextEnabled, mode: nextMode }, lang);
    setLoading(false);
    if (result.success) { setEnabled(nextEnabled); setMode(nextMode); router.refresh(); }
    else addToast({ title: intl.alerts.errorTt as string, description: profile.parentalControlUpdateError, variant: "error" });
  }
  const description = !globallyEnabled ? profile.parentalControlGlobalDisabled : user.birthYear === null ? profile.parentalControlMissingBirthDate : !adult ? globalMode === "strict" ? profile.parentalControlGlobalStrict : profile.parentalControlMinor : profile.parentalControlHelp;
  return <section className="rounded-lg bg-blackamber p-4"><h2 className="mb-2 flex items-center gap-2"><ShieldCheckIcon size={28} />{profile.parentalControl}</h2><p className="text-neutral-300">{description}</p>{editable && <div className="mt-5 space-y-4"><div className="flex items-center justify-between gap-4"><span>{profile.parentalControlEnabled}</span><Switch checked={enabled} disabled={loading} onCheckedChange={(next) => void save(next, mode)} /></div>{enabled && <fieldset className="space-y-3" disabled={loading}><label className="grid grid-cols-[auto_1fr] items-start gap-x-3"><input className="mt-1.5" type="radio" checked={mode === "flexible"} onChange={() => void save(true, "flexible")} /><span className="font-bold leading-tight">{profile.parentalControlFlexible}</span><span className="col-start-2 text-sm leading-snug text-neutral-300">{profile.parentalControlFlexibleHelp}</span></label><label className="grid grid-cols-[auto_1fr] items-start gap-x-3"><input className="mt-1.5" type="radio" checked={mode === "strict"} onChange={() => void save(true, "strict")} /><span className="font-bold leading-tight">{profile.parentalControlStrict}</span><span className="col-start-2 text-sm leading-snug text-neutral-300">{profile.parentalControlStrictHelp}</span></label></fieldset>}</div>}</section>;
}
