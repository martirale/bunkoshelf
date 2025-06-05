"use client";

import { UserRoundPen } from "lucide-react";
import { useState } from "react";
import Modal from "@/ui/Modal";
import EditUserForm from "./EditUserForm";

export default function UsersTable({ users, intl, currentUserId }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userList, setUserList] = useState(users);

  const handleEdit = (user) => {
    setSelectedUser(user);
  };

  const handleClose = () => {
    setSelectedUser(null);
  };

  // Función para actualizar el usuario en la lista
  const updateUserList = (updatedUser) => {
    setUserList((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  return (
    <>
      {/* Vista en pantallas grandes */}
      <div className="hidden md:block bg-blackamber p-4 rounded-lg space-y-4">
        <table className="table-fixed w-full">
          <thead className="bg-onix uppercase">
            <tr>
              <th className="p-4 text-left rounded-l-md">
                {intl.settings.username}
              </th>
              <th className="p-4">{intl.settings.type}</th>
              <th className="p-4">{intl.settings.name}</th>
              <th className="p-4">{intl.settings.lastname}</th>
              <th className="p-4">{intl.settings.age}</th>
              <th className="p-4 text-right rounded-r-md">
                {intl.settings.edit}
              </th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user) => {
              const currentYear = new Date().getFullYear();
              const age = user.birthYear ? currentYear - user.birthYear : "—";
              return (
                <tr key={user.id}>
                  <td className="p-4">{user.username}</td>
                  <td className="p-4 text-center">
                    {user.isAdmin ? intl.settings.admin : intl.settings.user}
                  </td>
                  <td className="p-4 text-center">{user.name || "—"}</td>
                  <td className="p-4 text-center">{user.lastname || "—"}</td>
                  <td className="p-4 text-center">{age}</td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <UserRoundPen
                        onClick={() => handleEdit(user)}
                        className="w-5 h-5 mr-2 cursor-pointer hover:text-lilah transition-colors duration-300"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista en móviles */}
      <div className="md:hidden space-y-4">
        {userList.map((user) => {
          const currentYear = new Date().getFullYear();
          const age = user.birthYear ? currentYear - user.birthYear : "—";
          return (
            <div
              key={user.id}
              className="bg-blackamber rounded-lg p-4 space-y-2 shadow-md"
            >
              <div className="flex justify-between">
                <span className="font-semibold">{intl.settings.username}:</span>
                <span>{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{intl.settings.type}:</span>
                <span>
                  {user.isAdmin ? intl.settings.admin : intl.settings.user}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{intl.settings.name}:</span>
                <span>{user.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{intl.settings.lastname}:</span>
                <span>{user.lastname || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{intl.settings.age}:</span>
                <span>{age}</span>
              </div>
              <div className="flex justify-end pt-2">
                <UserRoundPen
                  onClick={() => handleEdit(user)}
                  className="w-5 h-5 cursor-pointer text-pearl"
                />
              </div>
            </div>
          );
        })}
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
