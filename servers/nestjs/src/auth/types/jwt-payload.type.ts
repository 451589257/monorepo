/** access token 载荷,sub 为用户 id */
export interface JwtPayload {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}

/** refresh token 载荷,jti 为该 refresh 在 DB 中的唯一标识(token hash) */
export interface RefreshPayload {
  sub: number;
  jti: string;
  iat?: number;
  exp?: number;
}
