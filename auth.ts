import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const expectedEmail = process.env.AUTH_EMAIL;
        const hash = process.env.AUTH_PASSWORD_HASH;
        if (!expectedEmail || !hash) {
          console.error("AUTH_EMAIL or AUTH_PASSWORD_HASH is not set");
          return null;
        }
        if (String(credentials.email) !== expectedEmail) return null;
        const ok = await bcrypt.compare(String(credentials.password), hash);
        if (!ok) return null;
        return {
          id: "user",
          email: expectedEmail,
          name: expectedEmail,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.email = token.email as string;
      return session;
    },
  },
});
