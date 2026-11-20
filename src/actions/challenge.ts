"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { createId } from "@paralleldrive/cuid2";
import { queryOne } from "@/lib/db/query";
import { countReadingCompletions, getReadingCompletions } from "@/lib/db/readingCompletions";
import type { ReadingChallengeRecord } from "@/lib/types";

interface GetChallengeParams {
  year: number;
}

interface UpdateChallengeParams {
  year: number;
  goal?: number;
  notified?: boolean;
}

interface ReadingChallengeRow {
  id: string;
  user_id: string;
  year: number;
  goal: number;
  notified: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapChallenge(row: ReadingChallengeRow, completed: number): ReadingChallengeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    year: row.year,
    goal: row.goal,
    completed,
    notified: row.notified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCompletedCount(userId: string, year: number) {
  return countReadingCompletions(await getReadingCompletions(userId, new Date()), year);
}

export async function getChallenge({ year }: GetChallengeParams) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!year) {
    return { error: "Missing year", status: 400 };
  }

  const completedCount = await getCompletedCount(user.id, year);

  let challenge = await queryOne<ReadingChallengeRow>(
    `
      SELECT id, user_id, year, goal, notified, created_at, updated_at
      FROM reading_challenges
      WHERE user_id = $1
        AND year = $2
      LIMIT 1
    `,
    [user.id, year]
  );

  if (!challenge) {
    challenge = await queryOne<ReadingChallengeRow>(
      `
        INSERT INTO reading_challenges (
          id,
          user_id,
          year,
          goal,
          notified
        )
        VALUES ($1, $2, $3, 0, FALSE)
        RETURNING id, user_id, year, goal, notified, created_at, updated_at
      `,
      [createId(), user.id, year]
    );
  }

  return {
    challenge: challenge ? mapChallenge(challenge, completedCount) : null,
  };
}

export async function updateChallenge({ year, goal, notified }: UpdateChallengeParams) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!year || typeof year !== "number") {
      return { error: "Invalid year", status: 400 };
    }

    if (goal !== undefined && (typeof goal !== "number" || goal < 1)) {
      return { error: "Invalid goal", status: 400 };
    }

    let challenge = await queryOne<ReadingChallengeRow>(
      `
        SELECT id, user_id, year, goal, notified, created_at, updated_at
        FROM reading_challenges
        WHERE user_id = $1
          AND year = $2
        LIMIT 1
      `,
      [user.id, year]
    );

    const completedCount = await getCompletedCount(user.id, year);

    if (challenge) {
      challenge = await queryOne<ReadingChallengeRow>(
        `
          UPDATE reading_challenges
          SET goal = COALESCE($2, goal),
              notified = COALESCE($3, notified),
              updated_at = NOW()
          WHERE id = $1
          RETURNING id, user_id, year, goal, notified, created_at, updated_at
        `,
        [challenge.id, goal ?? null, notified ?? null]
      );
    } else {
      if (goal === undefined) {
        return { error: "Goal is required for new challenge", status: 400 };
      }

      challenge = await queryOne<ReadingChallengeRow>(
        `
          INSERT INTO reading_challenges (
            id,
            user_id,
            year,
            goal,
            notified
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, user_id, year, goal, notified, created_at, updated_at
        `,
        [createId(), user.id, year, goal, notified ?? false]
      );
    }

    return { challenge: challenge ? mapChallenge(challenge, completedCount) : null };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error updating challenge:", error);
      return { error: "Internal server error", status: 500 };
    }
  }
}
