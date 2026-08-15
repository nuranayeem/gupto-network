import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "./lib/prisma";

const signInSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1)
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        identifier: {
          label: "Email or username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { identifier, password } = parsed.data;

        const user = identifier.includes("@")
          ? await prisma.user.findUnique({
              where: { email: identifier },
            })
          : await prisma.user.findUnique({
              where: { username: identifier },
            });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(
          password,
          user.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
});
