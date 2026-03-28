"use client";

import { useState } from "react";
import CreateUserForm from "./CreateUserForm";
import Modal from "@/components/ui/Modal";
import { UserRoundPlusIcon } from "lucide-react";
import type { Dictionary } from "@/lib/types";

interface AddUserButtonProps {
  intl: Dictionary;
}

export default function AddUserButton({ intl }: AddUserButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center hover:underline cursor-pointer"
      >
        <UserRoundPlusIcon size={16} className="mr-1" />
        {intl.settings.createUser as string}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <CreateUserForm intl={intl} />
      </Modal>
    </>
  );
}
