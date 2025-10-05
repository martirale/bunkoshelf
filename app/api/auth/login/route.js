import { login } from "@/app/actions/login";

export async function POST(request) {
  const { username, password, lang } = await request.json();

  try {
    const result = await login({ username, password, lang });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    let errorMessage = "Server error";
    if (error.message === "missing") errorMessage = "Missing credentials";
    if (error.message === "invalid") errorMessage = "Invalid credentials";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}
