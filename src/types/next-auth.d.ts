import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      /** Twitter user ID */
      twitterId?: string;
      /** Twitter username */
      twitterUsername?: string;
      /** Twitter display name */
      twitterName?: string;
      /** Whether the user has verified their Twitter account */
      isTwitterVerified?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /** Extend JWT with Twitter-specific data */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    provider?: string;
    twitterId?: string;
    twitterUsername?: string;
    twitterName?: string;
  }
} 