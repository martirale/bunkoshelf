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
          <div className="min-w-[768px] xl:min-w-0 w-fit h-72 overflow-y-auto">
            <table className="table-fixed w-full">
              <thead className="bg-onix uppercase sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-left rounded-l-md">
                    {intl.settings.username}
                  </th>
                  <th className="p-4 text-center">{intl.settings.type}</th>
                  <th className="p-4 text-center">{intl.settings.name}</th>
                  <th className="p-4 text-center">{intl.settings.lastname}</th>
                  <th className="p-4 text-center">{intl.settings.age}</th>
                  <th className="p-4 text-right rounded-r-md sticky right-0 bg-onix z-20">
                    {intl.settings.edit}
                  </th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user) => {
                  const currentYear = new Date().getFullYear();
                  const age = user.birthYear
                    ? currentYear - user.birthYear
                    : "—";

                  return (
                    <tr key={user.id}>
                      <td className="p-4">{user.username}</td>
                      <td className="p-4 text-center">
                        {user.isAdmin
                          ? intl.settings.admin
                          : intl.settings.user}
                      </td>
                      <td className="p-4 text-center">{user.name || "—"}</td>
                      <td className="p-4 text-center">
                        {user.lastname || "—"}
                      </td>
                      <td className="p-4 text-center">{age}</td>
                      <td className="p-4 sticky right-0 bg-blackamber">
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
