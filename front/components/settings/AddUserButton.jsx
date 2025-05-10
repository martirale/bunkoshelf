"use client";

import { useState } from "react";
import CreateUserForm from "./CreateUserForm";
import Modal from "@/ui/Modal";

export default function AddUserButton({ intl }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>{intl.settings.createUser}</button>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <CreateUserForm intl={intl} />
      </Modal>
    </>
  );
}
