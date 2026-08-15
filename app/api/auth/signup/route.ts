import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(50),

  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform((value) => value.toLowerCase()),

  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),

  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid signup data",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, username, email, password } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return Response.json(
        {
          error: "Email or username is already in use",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          error: "Email or username is already in use",
        },
        { status: 409 }
      );
    }

    console.error("Signup error:", error);

    return Response.json(
      {
        error: "Unable to create account",
      },
      { status: 500 }
    );
  }
}
