import NextAuth from "next-auth";
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

// Define auth configuration
const handler = NextAuth({
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
      // Pass the Twitter API information to the token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = (account.expires_at as number) * 1000;
        token.provider = account.provider;

        // Add Twitter-specific user details
        if (profile) {
          // Cast profile to unknown first to avoid TypeScript strict type checking error
          const twitterProfile = profile as unknown as TwitterProfile;
          token.twitterId = twitterProfile.data?.id;
          token.twitterUsername = twitterProfile.data?.username;
          token.twitterName = twitterProfile.data?.name;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Pass token info to the client-side session
      if (session.user) {
        session.user.twitterId = token.twitterId as string;
        session.user.twitterUsername = token.twitterUsername as string;
        session.user.twitterName = token.twitterName as string;
        // Don't pass the actual tokens to the frontend, just validation status
        session.user.isTwitterVerified = !!token.accessToken;
      }
      // Add typed information to session
      return session;
    },
  },
  pages: {
    signIn: "/profile", // Custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
});

export const auth = handler.auth;
export { handler as GET, handler as POST }; 