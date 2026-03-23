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
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    );
  };

  return (
    <>
      <div className="bg-blackamber p-4 rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] xl:min-w-full h-72 overflow-y-auto">
            <div className="flex sticky top-0 z-10">
              <div className="grid grid-cols-5 flex-1 font-bold uppercase bg-onix rounded-l-md">
                <div className="p-4 text-left">{intl.settings.username}</div>
                <div className="p-4 text-center">{intl.settings.type}</div>
                <div className="p-4 text-center">{intl.settings.name}</div>
                <div className="p-4 text-center">{intl.settings.lastname}</div>
                <div className="p-4 text-center">{intl.settings.age}</div>
              </div>
              <div className="w-24 shrink-0 sticky right-0 bg-onix rounded-r-md p-4 text-center uppercase font-bold">
                {intl.settings.edit}
              </div>
            </div>

            {userList.map((user) => {
              const currentYear = new Date().getFullYear();
              const age = user.birthYear ? currentYear - user.birthYear : "—";

              return (
                <div key={user.id} className="flex">
                  <div className="grid grid-cols-5 flex-1">
                    <div className="p-4">{user.username}</div>
                    <div className="p-4 text-center">
                      <div className="flex gap-1 items-center mt-2">
                        <span className="bg-neutral-700 px-2 rounded-full text-xs uppercase">
                          {user.role === "ADMIN"
                            ? intl.settings.roleAdmin
                            : user.role === "GUEST"
                              ? intl.settings.roleGuest
                              : intl.settings.roleMember}
                        </span>
                        {user.isAdmin && (
                          <span className="bg-pearl text-onix px-2 rounded-full text-xs uppercase">
                            {intl.profile.usrAdmin}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 text-center">{user.name || "—"}</div>
                    <div className="p-4 text-center">
                      {user.lastname || "—"}
                    </div>
                    <div className="p-4 text-center">{age}</div>
                  </div>
                  <div className="w-24 shrink-0 sticky right-0 bg-blackamber p-4 flex items-center justify-center">
                    <UserRoundPenIcon
                      onClick={() => handleEdit(user)}
                      size={20}
                      className="cursor-pointer hover:text-lilah transition-colors duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
