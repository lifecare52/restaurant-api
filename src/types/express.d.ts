import type { JwtClaims } from '@shared/utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtClaims;
  }
}

export {};
