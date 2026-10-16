export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export const ok = <T = undefined>(data?: T): ActionResult<T> => ({ success: true, data });
export const fail = (error: string): ActionResult<never> => ({ success: false, error });
