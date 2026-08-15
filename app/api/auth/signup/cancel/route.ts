import { prisma } from "@/lib/prisma";
import { resendSignupOtpSchema } from "@/lib/signup-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendSignupOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Verification request is missing." },
        { status: 400 }
      );
    }

    await prisma.pendingSignup.deleteMany({
      where: {
        id: parsed.data.requestId,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Signup cancellation error:", error);

    return Response.json(
      { error: "Unable to restart signup right now." },
      { status: 500 }
    );
  }
}
