import { prisma } from "@/lib/prisma";
import { passwordResetEmailSchema } from "@/lib/password-reset-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = passwordResetEmailSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          valid: false,
          exists: false,
          error:
            parsed.error.flatten().fieldErrors.email?.[0] ||
            "Enter a valid Gmail address.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, passwordHash: true },
    });

    const exists = Boolean(user?.passwordHash);

    return Response.json({
      valid: true,
      exists,
      message: exists
        ? "Gupto account found."
        : "No Gupto account was found with that Gmail address.",
    });
  } catch (error) {
    console.error("Password reset availability error:", error);
    return Response.json(
      { valid: false, exists: false, error: "Unable to check that Gmail right now." },
      { status: 500 }
    );
  }
}
