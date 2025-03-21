import type { NextAuthConfig } from "next-auth";
import Twitter from "next-auth/providers/twitter";
import { type DefaultSession } from "next-auth";

// Define proper types for the Twitter profile
interface TwitterProfile {
  data?: {
    id: string;
    name: string;
    username: string;
  };
}

// Extend the session type
declare module "next-auth" {
  interface Session {
    user: {
      twitterId?: string;
      twitterUsername?: string;
      twitterName?: string;
      isTwitterVerified?: boolean;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, account, profile }) => {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = (account.expires_at as number) * 1000;
        token.provider = account.provider;

        if (profile) {
          const twitterProfile = profile as unknown as TwitterProfile;
          token.twitterId = twitterProfile.data?.id;
          token.twitterUsername = twitterProfile.data?.username;
          token.twitterName = twitterProfile.data?.name;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.twitterId = token.twitterId as string;
        session.user.twitterUsername = token.twitterUsername as string;
        session.user.twitterName = token.twitterName as string;
        session.user.isTwitterVerified = !!token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/profile",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig; 