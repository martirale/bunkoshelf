"use server";

import { verifySession } from "@/lib/auth/verifySession";
import {
  getBookReaderStats,
  listBooksInProgress,
} from "@/lib/db/books/library";

export async function getBooksInProgress() {
  const user = await verifySession();
  if (!user) return { success: false as const, data: [] };

  const books = await listBooksInProgress(user.id);
  return {
    success: true as const,
    data: books.map((book) => ({
      id: book.id,
      slug: book.slug,
      title: book.metadata.title,
      coverImage: book.metadata.coverPath,
      progression: book.progression,
    })),
  };
}

export async function getBooksReaderStats() {
  const user = await verifySession();
  if (!user) return { error: "Unauthorized" as const };
  return getBookReaderStats(user.id);
}
