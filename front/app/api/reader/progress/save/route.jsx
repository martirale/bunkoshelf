import prisma from "@/lib/prisma";
import verifySession from "@/lib/auth/verifySession";

export default async function handler(req, res) {
  const user = await verifySession(req);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const { volumeId, lastPage, totalPages } = req.body;

    if (!volumeId) {
      return res.status(400).json({ error: "Missing volumeId" });
    }

    try {
      const record = await prisma.userToVolume.upsert({
        where: {
          userId_volumeId: {
            userId: user.id,
            volumeId: parseInt(volumeId),
          },
        },
        update: {
          lastPage: lastPage ?? undefined,
          totalPages: totalPages ?? undefined,
          lastReadAt: new Date(),
        },
        create: {
          userId: user.id,
          volumeId: parseInt(volumeId),
          lastPage: lastPage ?? null,
          totalPages: totalPages ?? null,
          lastReadAt: new Date(),
        },
      });

      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "GET") {
    const { volumeId } = req.query;

    if (!volumeId) {
      return res.status(400).json({ error: "Missing volumeId" });
    }

    try {
      const record = await prisma.userToVolume.findUnique({
        where: {
          userId_volumeId: {
            userId: user.id,
            volumeId: parseInt(volumeId),
          },
        },
      });

      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
