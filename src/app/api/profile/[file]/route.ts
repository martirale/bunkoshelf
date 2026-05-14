import { readProfileImage } from "@/lib/profileImage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params;

  if (!file || file.includes("/") || file.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }

  const response = await readProfileImage(file);

  if (!response) {
    return new Response("Not found", { status: 404 });
  }

  return response;
}
