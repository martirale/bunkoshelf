"use client";

import { UserRoundPen } from "lucide-react";
import { useState } from "react";
import Modal from "../ui/Modal";
import EditUserForm from "./EditUserForm";

export default function UsersTable({ users, intl, currentUserId }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userList, setUserList] = useState(users);

  const handleEdit = (user) => setSelectedUser(user);
  const handleClose = () => setSelectedUser(null);

  const updateUserList = (updatedUser) => {
    setUserList((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  return (
    <>
      <div className="bg-blackamber p-4 rounded-lg relative">
        {/* Scroll horizontal solo para columnas de datos */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] xl:min-w-full h-72 overflow-y-auto pr-24">
            {/* Header sin columna de edición */}
            <div className="grid grid-cols-5 font-bold uppercase bg-onix sticky top-0 z-10 rounded-l-md">
              <div className="p-4 text-left">{intl.settings.username}</div>
              <div className="p-4 text-center">{intl.settings.type}</div>
              <div className="p-4 text-center">{intl.settings.name}</div>
              <div className="p-4 text-center">{intl.settings.lastname}</div>
              <div className="p-4 text-center">{intl.settings.age}</div>
            </div>

            {/* Filas sin columna de edición */}
            {userList.map((user) => {
              const currentYear = new Date().getFullYear();
              const age = user.birthYear ? currentYear - user.birthYear : "—";

              return (
                <div key={user.id} className="grid grid-cols-5">
                  <div className="p-4">{user.username}</div>
                  <div className="p-4 text-center">
                    {user.isAdmin ? intl.settings.admin : intl.settings.user}
                  </div>
                  <div className="p-4 text-center">{user.name || "—"}</div>
                  <div className="p-4 text-center">{user.lastname || "—"}</div>
                  <div className="p-4 text-center">{age}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna fija de edición */}
        <div className="bg-blackamber absolute top-0 right-0 h-full w-24 pointer-events-none rounded-r-lg">
          {/* Header sticky */}
          <div className="p-4 text-center uppercase font-bold bg-onix sticky mt-4 mr-4 -ml-4 z-20 pointer-events-auto rounded-r-md">
            {intl.settings.edit}
          </div>

          {/* Iconos por usuario */}
          {userList.map((user) => (
            <div
              key={`edit-${user.id}`}
              className="p-4 -ml-4 z-10 pointer-events-auto"
            >
              <div className="flex justify-center">
                <UserRoundPen
                  onClick={() => handleEdit(user)}
                  className="w-5 h-5 cursor-pointer hover:text-lilah transition-colors duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para editar */}
      <Modal isOpen={!!selectedUser} onClose={handleClose}>
        <EditUserForm
          user={selectedUser}
          currentUserId={currentUserId}
          intl={intl}
          onSuccess={updateUserList}
        />
      </Modal>
    </>
  );
}
