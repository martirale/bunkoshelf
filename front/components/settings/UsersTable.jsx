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
      <div className="bg-blackamber p-4 rounded-lg space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] xl:min-w-0 w-fit h-72 overflow-y-auto">
            {/* Header */}
            <div className="grid grid-cols-6 font-bold uppercase bg-onix sticky top-0 z-10">
              <div className="p-4 text-left">{intl.settings.username}</div>
              <div className="p-4 text-center">{intl.settings.type}</div>
              <div className="p-4 text-center">{intl.settings.name}</div>
              <div className="p-4 text-center">{intl.settings.lastname}</div>
              <div className="p-4 text-center">{intl.settings.age}</div>
              <div className="p-4 text-right sticky right-0 bg-onix z-20">
                {intl.settings.edit}
              </div>
            </div>

            {/* Rows */}
            {userList.map((user) => {
              const currentYear = new Date().getFullYear();
              const age = user.birthYear ? currentYear - user.birthYear : "—";

              return (
                <div key={user.id} className="grid grid-cols-6">
                  <div className="p-4">{user.username}</div>
                  <div className="p-4 text-center">
                    {user.isAdmin ? intl.settings.admin : intl.settings.user}
                  </div>
                  <div className="p-4 text-center">{user.name || "—"}</div>
                  <div className="p-4 text-center">{user.lastname || "—"}</div>
                  <div className="p-4 text-center">{age}</div>
                  <div className="p-4 sticky right-0 bg-blackamber z-10">
                    <div className="flex justify-end">
                      <UserRoundPen
                        onClick={() => handleEdit(user)}
                        className="w-5 h-5 mr-2 cursor-pointer hover:text-lilah transition-colors duration-300"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
