import { prisma } from "@/lib/prisma";
import { passwordResetRequestSchema } from "@/lib/password-reset-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = passwordResetRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Password reset request is missing." }, { status: 400 });
    }

    await prisma.passwordResetRequest.deleteMany({
      where: { id: parsed.data.requestId, usedAt: null },
    });

    return Response.json({ message: "Password reset request cancelled." });
  } catch (error) {
    console.error("Cancel password reset error:", error);
    return Response.json(
      { error: "Unable to cancel password recovery right now." },
      { status: 500 }
    );
  }
}
