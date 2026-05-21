"use client";

import { UserRoundPenIcon } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import EditUserForm from "./EditUserForm";
import type { Dictionary } from "@/lib/types";

interface UserRow {
  id: string;
  username: string;
  isAdmin: boolean;
  role: string;
  name: string | null;
  lastname: string | null;
  birthYear: number | null;
}

interface UsersTableProps {
  users: UserRow[];
  intl: Dictionary;
  currentUserId: string | undefined;
}

export default function UsersTable({
  users,
  intl,
  currentUserId,
}: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userList, setUserList] = useState<UserRow[]>(users);

  const handleEdit = (user: UserRow) => setSelectedUser(user);
  const handleClose = () => setSelectedUser(null);

  const updateUserList = (updatedUser: UserRow) => {
    setUserList((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    );
  };

  return (
    <>
      <div className="bg-blackamber p-4 rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] xl:min-w-full">
            <div className="flex sticky top-0 z-10">
              <div className="grid grid-cols-5 flex-1 font-bold uppercase bg-onix rounded-l-md">
                <div className="p-4 text-left">{intl.settings.username as string}</div>
                <div className="p-4 text-center">{intl.settings.type as string}</div>
                <div className="p-4 text-center">{intl.settings.name as string}</div>
                <div className="p-4 text-center">{intl.settings.lastname as string}</div>
                <div className="p-4 text-center">{intl.settings.age as string}</div>
              </div>
              <div className="w-24 shrink-0 sticky right-0 bg-onix rounded-r-md p-4 text-center uppercase font-bold">
                {intl.settings.edit as string}
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
                            ? (intl.settings.roleAdmin as string)
                            : user.role === "GUEST"
                              ? (intl.settings.roleGuest as string)
                              : (intl.settings.roleMember as string)}
                        </span>
                        {user.isAdmin && (
                          <span className="bg-pearl text-onix px-2 rounded-full text-xs uppercase">
                            {intl.profile.usrAdmin as string}
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
                    <button
                      type="button"
                      onClick={() => handleEdit(user)}
                      title={intl.settings.edit as string}
                      className="border border-stone-300 md:border-neutral-800 hover:text-pearl rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-lilah"
                    >
                      <UserRoundPenIcon size={16} />
                    </button>
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
