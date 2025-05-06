import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "bunkoshelf-secret";

export async function checkAdminAccess() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return { isAdmin: false, lang: null };

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    return {
      isAdmin: !!payload.isAdmin,
      lang: payload.lang || "es", // o extraerlo de otra fuente si no lo tienes en el token
    };
  } catch (err) {
    return { isAdmin: false, lang: null };
  }
}
