"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth/verifySession";
import { findUserSessionById, updateUserRecord } from "@/lib/db/users";
import { log } from "@/lib/logger";
import {
  deleteProfileImage,
  saveProfileImage,
  validateProfileImage,
} from "@/lib/profileImage";

interface UpdateProfileResult {
  success?: boolean;
  error?: string;
  status?: number;
}

export async function updateProfile(
  formData: FormData,
  lang: string
): Promise<UpdateProfileResult> {
  try {
    const session = await verifySession();
    if (!session) {
      return { error: "Unauthorized", status: 401 };
    }

    const name = formData.get("name");
    const lastname = formData.get("lastname");
    const password = formData.get("password");
    const profileImageInput = formData.get("profileImage");
    const removeProfileImage = formData.get("removeProfileImage") === "true";

    const start = Date.now();
    const user = await findUserSessionById(session.id);
    let nextProfileImage = removeProfileImage ? null : user?.profileImage;
    let uploadedProfileImage: string | null = null;

    if (profileImageInput instanceof File && profileImageInput.size > 0) {
      const validationError = validateProfileImage(profileImageInput);

      if (validationError) {
        return { error: validationError, status: 400 };
      }

      uploadedProfileImage = await saveProfileImage(profileImageInput, session.id);
      nextProfileImage = uploadedProfileImage;
    }

    try {
      await updateUserRecord(session.id, {
        name: typeof name === "string" ? name : undefined,
        lastname: typeof lastname === "string" ? lastname : undefined,
        profileImage: nextProfileImage,
        ...(typeof password === "string" && password.length > 0
          ? { password: await hash(password, 10) }
          : {}),
      });
    } catch (error) {
      if (uploadedProfileImage) {
        await deleteProfileImage(uploadedProfileImage);
      }
      throw error;
    }

    if (
      user?.profileImage &&
      (removeProfileImage || (uploadedProfileImage && user.profileImage !== uploadedProfileImage))
    ) {
      await deleteProfileImage(user.profileImage);
    }

    const duration = Date.now() - start;

    log({
      event: "User update",
      category: "USERS",
      duration,
      meta: {
        userId: session.id,
        username: user?.username || "unknown",
        passwordUpdated: typeof password === "string" && password.length > 0,
        profileImageUpdated: !!uploadedProfileImage,
        profileImageRemoved: removeProfileImage,
      },
    });

    revalidatePath(`/${lang}/profile`);
    revalidatePath(`/${lang}/profile/update`);

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Database error", status: 500 };
  }
}
