import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** Regex: must be a valid IITGN email, e.g. firstname.lastname@iitgn.ac.in */
const IITGN_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@iitgn\.ac\.in$/i;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "IITGN Email",
      credentials: {
        email: { label: "IITGN Email", type: "email", placeholder: "you@iitgn.ac.in" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Validate email domain with regex
        if (!IITGN_EMAIL_REGEX.test(credentials.email)) {
          throw new Error("Only @iitgn.ac.in email addresses are allowed.");
        }

        // 2. Look up the user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) {
          throw new Error("No account found. Please register first.");
        }

        // 3. Compare password hash
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          karmaScore: user.karmaScore,
          roles: user.roles,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.karmaScore = (user as any).karmaScore ?? 0;
        token.roles = (user as any).roles ?? ["Buyer"];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).karmaScore = token.karmaScore ?? 0;
        (session.user as any).roles = token.roles ?? ["Buyer"];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
