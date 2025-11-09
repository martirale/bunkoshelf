"use client";

import { useState } from "react";
import CreateUserForm from "./CreateUserForm";
import Modal from "@/components/ui/Modal";
import { UserRoundPlusIcon } from "lucide-react";

export default function AddUserButton({ intl }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center hover:underline cursor-pointer"
      >
        <UserRoundPlusIcon size={16} className="mr-1" />
        {intl.settings.createUser}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <CreateUserForm intl={intl} />
      </Modal>
    </>
  );
}
