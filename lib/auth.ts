import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return false;

      await prisma.user.upsert({
        where: { googleId: account.providerAccountId },
        create: {
          googleId: account.providerAccountId,
          email: user.email!,
          name: user.name!,
          image: user.image ?? null,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          tokenExpiry: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
        },
        update: {
          email: user.email!,
          name: user.name!,
          image: user.image ?? null,
          accessToken: account.access_token ?? null,
          ...(account.refresh_token
            ? { refreshToken: account.refresh_token }
            : {}),
          tokenExpiry: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
        },
      });

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        // Fetch userId from DB
        const dbUser = await prisma.user.findUnique({
          where: { googleId: account.providerAccountId },
          select: { id: true },
        });
        token.userId = dbUser?.id;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.userId = token.userId as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
