import clsx from "clsx";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export default async function UserAvatar({ intl }) {
  const userSession = await verifySession();

  if (!userSession) return null;

  const user = await prisma.user.findUnique({
    where: { id: userSession.id },
    select: {
      name: true,
      lastname: true,
      isAdmin: true,
      birthYear: true,
    },
  });

  if (!user) return null;

  const initials = `${user.name?.[0] ?? ""}${
    user.lastname?.[0] ?? ""
  }`.toUpperCase();

  const age =
    typeof user.birthYear === "number"
      ? new Date().getFullYear() - user.birthYear
      : null;

  return (
    <div className="flex flex-col items-center gap-4 text-center my-8 md:mb-16">
      <div
        className={clsx(
          "rounded-full bg-lilah text-sand flex items-center justify-center font-bold",
          "text-5xl w-40 h-40",
          "md:w-48 md:h-48 md:text-7xl"
        )}
      >
        {initials}
      </div>

      <div className="flex flex-col items-center justify-center mt-4">
        <h3 className="text-2xl md:text-3xl mb-2">
          {user.name} {user.lastname}
        </h3>

        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          <span
            className={clsx(
              "inline-flex items-center px-3 py-1 text-xs font-medium rounded-md uppercase border",
              user.isAdmin
                ? "bg-pearl text-onix border-pearl"
                : "border-neutral-700"
            )}
          >
            {user.isAdmin
              ? `${intl.profile.usrAdmin}`
              : `${intl.profile.usrNormal}`}
          </span>

          {age !== null && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md uppercase border border-neutral-700">
              {age} {intl.profile.age}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
