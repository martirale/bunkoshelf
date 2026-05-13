export interface ChallengeData {
  goal: number;
  progress: number;
  percentage: number;
}

export interface ReadingChallengeRecord {
  id: string;
  userId: string;
  year: number;
  goal: number;
  completed: number;
  notified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
