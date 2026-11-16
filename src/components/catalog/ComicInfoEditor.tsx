"use client";

import { useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FilePenLineIcon, Loader2Icon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";
import { getComicInfo, saveComicInfo } from "@/actions/comic-info";
import type { Dictionary } from "@/lib/types";

interface ComicInfoEditorProps {
  volumeId: string;
  intl: Dictionary;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ComicInfoEditor({ volumeId, intl, disabled, onOpenChange }: ComicInfoEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [xml, setXml] = useState("");
  const [original, setOriginal] = useState("");
  const [revision, setRevision] = useState("");
  const [error, setError] = useState<string | null>(null);
  const labels = intl.catalog as Record<string, string>;
  const id = useId();
  const router = useRouter();
  const { addToast } = useToast()!;

  function showError(code: string) {
    setError(labels[`comicInfo${code.charAt(0).toUpperCase()}${code.slice(1)}`] || labels.comicInfoSaveError);
  }

  function close() {
    if (saving || loading) return;
    setIsOpen(false);
    onOpenChange(false);
  }

  async function open() {
    setIsOpen(true);
    onOpenChange(true);
    setLoading(true);
    setError(null);
    setRevision("");
    setXml("");
    try {
      const result = await getComicInfo(volumeId);
      if (!result.ok) {
        showError(result.error);
        return;
      }
      setXml(result.xml);
      setOriginal(result.xml);
      setRevision(result.revision);
    } catch {
      showError("loadError");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await saveComicInfo(volumeId, xml, revision);
      if (!result.ok) {
        showError(result.error);
        return;
      }
      addToast({ title: labels.editComicInfo, description: labels.comicInfoSaved, variant: "success" });
      setIsOpen(false);
      onOpenChange(false);
      window.dispatchEvent(new Event("bunko:library-updated"));
      router.refresh();
    } catch {
      showError("saveError");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <button type="button" onClick={open} disabled={disabled} title={labels.editComicInfo} aria-label={labels.editComicInfo}
      className="border border-neutral-800 hover:text-pearl rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-lilah disabled:opacity-50 disabled:cursor-not-allowed">
      <FilePenLineIcon size={16} />
    </button>
    {isOpen && createPortal(<Modal isOpen={isOpen} onClose={close}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="space-y-4 text-left">
        <h2 id={`${id}-title`}>{labels.editComicInfo}</h2>
        <p className="text-sm">{labels.comicInfoDescription}</p>
        {loading ? <div className="flex items-center gap-2 py-12"><Loader2Icon size={20} className="animate-spin" />{labels.comicInfoLoading}</div> : revision && <>
          <label htmlFor={`${id}-xml`} className="block text-sm">ComicInfo.xml</label>
          <textarea id={`${id}-xml`} value={xml} onChange={(event) => setXml(event.target.value)} disabled={saving}
            spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-describedby={error ? `${id}-error` : undefined}
            className="block w-full h-[45vh] resize-y rounded-lg border border-onix bg-pearl p-4 font-mono text-sm disabled:opacity-60" />
          <p className="text-sm">{labels.comicInfoTitlesHelp}</p>
        </>}
        {error && <p id={`${id}-error`} role="alert" className="text-danger-alt">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="lightAlt" size="small" onClick={close} disabled={saving || loading}>{labels.comicInfoCancel}</Button>
          <Button type="submit" variant="dark" size="small" disabled={loading || saving || !revision || xml === original}>
            {saving ? <><Loader2Icon size={16} className="mr-2 animate-spin" />{labels.comicInfoSaving}</> : labels.comicInfoSave}
          </Button>
        </div>
      </form>
    </Modal>, document.body)}
  </>;
}
