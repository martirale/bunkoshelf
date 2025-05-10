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
      <div className="space-y-4">
        <table className="table-fixed w-full text-left">
          <thead className="uppercase">
            <tr>
              <th className="p-2 border-b">{intl.settings.username}</th>
              <th className="p-2 border-b">{intl.settings.type}</th>
              <th className="p-2 border-b">{intl.settings.name}</th>
              <th className="p-2 border-b">{intl.settings.lastname}</th>
              <th className="p-2 border-b">{intl.settings.age}</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user) => {
              const currentYear = new Date().getFullYear();
              const age = user.birthYear ? currentYear - user.birthYear : "—";
              return (
                <tr key={user.id} className="border-t">
                  <td className="p-2">{user.username}</td>
                  <td className="p-2">{user.isAdmin ? "Admin" : "User"}</td>
                  <td className="p-2">{user.name || "—"}</td>
                  <td className="p-2">{user.lastname || "—"}</td>
                  <td className="p-2">{age}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex items-center cursor-pointer"
                    >
                      <UserRoundPen className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
