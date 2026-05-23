export const CODE = {
  SUCCESS: 0,
  FAIL: -1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export type CodeType = (typeof CODE)[keyof typeof CODE];
