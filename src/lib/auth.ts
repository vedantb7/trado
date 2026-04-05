import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

const IITGN_EMAIL_DOMAIN = "iitgn.ac.in";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[AUTH DEBUG] Attempting sign-in for:", user.email);
      
      if (!user.email) {
        console.error("[AUTH DEBUG] Denied: No email provided from Google.");
        return false;
      }
      
      if (user.email.endsWith(`@${IITGN_EMAIL_DOMAIN}`)) {
        console.log("[AUTH DEBUG] Success: @iitgn.ac.in domain verified.");
        return true;
      }
      
      console.error("[AUTH DEBUG] Denied: Domain restriction mismatch for", user.email);
      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        console.log("[AUTH DEBUG] Extracting DB identity for:", user.email);
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, roles: true, karmaScore: true }
        });

        if (dbUser) {
           console.log("[AUTH DEBUG] Found DB User:", dbUser.id, "Roles:", dbUser.roles);
           token.id = dbUser.id;
           token.roles = dbUser.roles;
           token.karmaScore = dbUser.karmaScore;
        } else {
           console.warn("[AUTH DEBUG] New user detected, providing defaults.");
           token.id = user.id;
           token.roles = ["Buyer"];
           token.karmaScore = 0;
        }
        
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).roles = token.roles as string[];
        (session.user as any).karmaScore = token.karmaScore as number;
        
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};
