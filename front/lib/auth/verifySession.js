import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function verifySession() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return {
      id: payload.id,
      username: payload.username,
      isAdmin: payload.isAdmin,
      name: payload.name,
      lastname: payload.lastname,
    };
  } catch {
    return null;
  }
}
