"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { createId } from "@paralleldrive/cuid2";
import { query, queryOne } from "@/lib/db/query";
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
  completed: number;
  notified: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapChallenge(row: ReadingChallengeRow): ReadingChallengeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    year: row.year,
    goal: row.goal,
    completed: row.completed,
    notified: row.notified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getChallenge({ year }: GetChallengeParams) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!year) {
    return { error: "Missing year", status: 400 };
  }

  let challenge = await queryOne<ReadingChallengeRow>(
    `
      SELECT id, user_id, year, goal, completed, notified, created_at, updated_at
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
          completed,
          notified
        )
        VALUES ($1, $2, $3, 0, 0, FALSE)
        RETURNING id, user_id, year, goal, completed, notified, created_at, updated_at
      `,
      [createId(), user.id, year]
    );
  }

  return { challenge: challenge ? mapChallenge(challenge) : null };
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
        SELECT id, user_id, year, goal, completed, notified, created_at, updated_at
        FROM reading_challenges
        WHERE user_id = $1
          AND year = $2
        LIMIT 1
      `,
      [user.id, year]
    );

    const volumesRead = await query<{ last_read_at: Date | null }>(
      `
        SELECT last_read_at
        FROM user_to_volumes
        WHERE user_id = $1
          AND is_read = TRUE
      `,
      [user.id]
    );

    const completedCount = volumesRead.filter((vol) => {
      if (!vol.last_read_at) return false;
      const lastReadDate = new Date(vol.last_read_at);
      return lastReadDate.getFullYear() === year;
    }).length;

    if (challenge) {
      challenge = await queryOne<ReadingChallengeRow>(
        `
          UPDATE reading_challenges
          SET completed = $2,
              goal = COALESCE($3, goal),
              notified = COALESCE($4, notified),
              updated_at = NOW()
          WHERE id = $1
          RETURNING id, user_id, year, goal, completed, notified, created_at, updated_at
        `,
        [challenge.id, completedCount, goal ?? null, notified ?? null]
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
            completed,
            notified
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, user_id, year, goal, completed, notified, created_at, updated_at
        `,
        [createId(), user.id, year, goal, completedCount, notified ?? false]
      );
    }

    return { challenge: challenge ? mapChallenge(challenge) : null };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error updating challenge:", error);
      return { error: "Internal server error", status: 500 };
    }
  }
}
