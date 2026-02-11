import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AuthOptions } from "next-auth";
import NextAuth, { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const gmailScope = "openid email profile https://www.googleapis.com/auth/gmail.readonly";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: gmailScope,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.access_token || !user.email) return true;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (!dbUser) return true;

      await prisma.inboxConnection.upsert({
        where: { userId: dbUser.id },
        update: {
          accessToken: account.access_token,
          refreshToken: account.refresh_token || undefined,
          apEmailAddress: user.email,
        },
        create: {
          userId: dbUser.id,
          provider: "google",
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          apEmailAddress: user.email,
        },
      });
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export const handler = NextAuth(authOptions);
export const auth = () => getServerSession(authOptions);
