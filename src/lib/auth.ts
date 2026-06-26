import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

async function logActivity(action: string, email?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        description: `User: ${email || "unknown"}`,
        performedBy: email || "system",
      },
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

export const authOptions = {
  secret,
  trustHost: true,
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials: Record<string, string> | undefined) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              role: "USER",
              password: hashedPassword,
            },
          });
        } else {
          const passwordValid = await bcrypt.compare(
            credentials.password,
            user.password || ""
          );

          if (!passwordValid) {
            return null;
          }
        }

        const role = email === "user@gmail.com" ? "ADMIN" : user.role;

        // Log successful login
        await logActivity("User Login", email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };