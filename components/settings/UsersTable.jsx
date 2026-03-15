"use client";

import { UserRoundPenIcon } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
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
        <div className="overflow-x-auto">
          <div className="min-w-[800px] xl:min-w-full h-72 overflow-y-auto pr-24">
            <div className="grid grid-cols-5 font-bold uppercase bg-onix sticky top-0 z-10 rounded-l-md">
              <div className="p-4 text-left">{intl.settings.username}</div>
              <div className="p-4 text-center">{intl.settings.type}</div>
              <div className="p-4 text-center">{intl.settings.name}</div>
              <div className="p-4 text-center">{intl.settings.lastname}</div>
              <div className="p-4 text-center">{intl.settings.age}</div>
            </div>

            {userList.map((user) => {
              const currentYear = new Date().getFullYear();
              const age = user.birthYear ? currentYear - user.birthYear : "—";

              return (
                <div key={user.id} className="grid grid-cols-5">
                  <div className="p-4">{user.username}</div>
                  <div className="p-4 text-center flex items-center justify-center gap-1">
                    <span className="bg-neutral-700 px-2 py-1 rounded-full text-xs uppercase">
                      {user.role === "ADMIN"
                        ? intl.settings.roleAdmin
                        : user.role === "GUEST"
                          ? intl.settings.roleGuest
                          : intl.settings.roleMember}
                    </span>
                    {user.isAdmin && (
                      <span className="bg-pearl text-onix px-2 py-1 rounded-full text-xs uppercase">
                        {intl.profile.usrAdmin}
                      </span>
                    )}
                  </div>
                  <div className="p-4 text-center">{user.name || "—"}</div>
                  <div className="p-4 text-center">{user.lastname || "—"}</div>
                  <div className="p-4 text-center">{age}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blackamber absolute top-0 right-0 h-full w-24 pointer-events-none rounded-r-lg">
          <div className="p-4 text-center uppercase font-bold bg-onix sticky mt-4 mr-4 -ml-4 z-20 pointer-events-auto rounded-r-md">
            {intl.settings.edit}
          </div>

          {userList.map((user) => (
            <div
              key={`edit-${user.id}`}
              className="p-4 -ml-4 z-10 pointer-events-auto"
            >
              <div className="flex justify-center">
                <UserRoundPenIcon
                  onClick={() => handleEdit(user)}
                  size={20}
                  className="cursor-pointer hover:text-lilah transition-colors duration-300"
                />
              </div>
            </div>
          ))}
        </div>
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
