import type { AuthRole } from './domain-types.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: {
        userId: string;
        role: AuthRole;
        email: string;
        tokenId: string;
        tokenExp: number;
      };
    }
  }
}

export {};
