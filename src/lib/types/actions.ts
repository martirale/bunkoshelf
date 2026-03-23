export type ActionSuccess<T = void> = T extends void
  ? { success: true }
  : { success: true; data: T };

export type ActionError = {
  error: string;
  status: number;
};

export type ActionResponse<T = void> = ActionSuccess<T> | ActionError;
