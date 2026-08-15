import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import GuptoNetworkApp from "@/components/GuptoNetworkApp";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      name: true,
      username: true,
      email: true,
    },
  });

  const name = dbUser?.name || session.user.name || "User";
  const username =
    dbUser?.username ||
    session.user.email.split("@")[0];

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <GuptoNetworkApp
      currentUser={{
        name,
        username,
        initials,
      }}
    />
  );
}
