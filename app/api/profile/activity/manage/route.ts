import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const activityKindSchema = z.enum(["react", "comment", "reply"]);

const selectedItemSchema = z.object({
  kind: activityKindSchema,
  id: z.string().trim().min(1),
});

const deleteRequestSchema = z.object({
  mode: z.enum(["selected", "type", "range", "all"]),
  items: z.array(selectedItemSchema).max(5000).optional(),
  types: z.array(activityKindSchema).min(1).max(3).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).superRefine((value, context) => {
  if (value.mode === "selected" && !value.items?.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one activity.", path: ["items"] });
  }
  if (value.mode === "type" && !value.types?.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose at least one activity type.", path: ["types"] });
  }
  if (value.mode === "range" && !value.from && !value.to) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a time range.", path: ["from"] });
  }
});

type ActivityKind = z.infer<typeof activityKindSchema>;
type DeleteRequest = z.infer<typeof deleteRequestSchema>;

type DateWindow = { gte?: Date; lt?: Date };

function parseDateWindow(body: DeleteRequest): DateWindow | undefined {
  if (body.mode !== "range") return undefined;
  const window: DateWindow = {};
  if (body.from) window.gte = new Date(body.from);
  if (body.to) window.lt = new Date(body.to);
  return window;
}

function selectedIds(body: DeleteRequest, kind: ActivityKind) {
  if (body.mode !== "selected") return null;
  return [...new Set((body.items || []).filter((item) => item.kind === kind).map((item) => item.id))];
}

function targetsKind(body: DeleteRequest, kind: ActivityKind) {
  if (body.mode === "all" || body.mode === "range") return true;
  if (body.mode === "type") return Boolean(body.types?.includes(kind));
  return Boolean(selectedIds(body, kind)?.length);
}

export async function DELETE(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const viewer = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!viewer) return NextResponse.json({ error: "User account not found." }, { status: 401 });

  const parsed = deleteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid activity management request." }, { status: 400 });
  }

  const body = parsed.data;
  const dateWindow = parseDateWindow(body);

  const reactionIds = selectedIds(body, "react");
  const commentIds = selectedIds(body, "comment");
  const replyIds = selectedIds(body, "reply");

  const reactionWhere = targetsKind(body, "react")
    ? {
        userId: viewer.id,
        ...(reactionIds ? { id: { in: reactionIds } } : {}),
        ...(dateWindow ? { createdAt: dateWindow } : {}),
      }
    : null;

  const commentWhere = targetsKind(body, "comment")
    ? {
        authorId: viewer.id,
        ...(commentIds ? { id: { in: commentIds } } : {}),
        ...(dateWindow ? { createdAt: dateWindow } : {}),
      }
    : null;

  const replyWhere = targetsKind(body, "reply")
    ? {
        authorId: viewer.id,
        ...(replyIds ? { id: { in: replyIds } } : {}),
        ...(dateWindow ? { createdAt: dateWindow } : {}),
      }
    : null;

  const [reactionTargets, commentTargets] = await Promise.all([
    reactionWhere
      ? prisma.postReaction.findMany({ where: reactionWhere, select: { id: true, postId: true } })
      : Promise.resolve([]),
    commentWhere
      ? prisma.postComment.findMany({ where: commentWhere, select: { id: true, postId: true } })
      : Promise.resolve([]),
  ]);

  const results = await prisma.$transaction(async (tx) => {
    const counts: number[] = [];
    // Replies are deleted first so an explicitly selected reply is handled before
    // a selected parent comment can cascade through the same reply tree.
    if (replyWhere) counts.push((await tx.postReply.deleteMany({ where: replyWhere })).count);
    if (commentWhere) counts.push((await tx.postComment.deleteMany({ where: commentWhere })).count);
    if (reactionWhere) counts.push((await tx.postReaction.deleteMany({ where: reactionWhere })).count);
    return counts;
  });

  const reactionPostIds = [...new Set(reactionTargets.map((item) => item.postId))];
  const commentPostIds = [...new Set(commentTargets.map((item) => item.postId))];

  const [reactionCounts, commentCounts] = await Promise.all([
    Promise.all(reactionPostIds.map(async (postId) => ({
      postId,
      count: await prisma.postReaction.count({ where: { postId } }),
    }))),
    Promise.all(commentPostIds.map(async (postId) => ({
      postId,
      count: await prisma.postComment.count({ where: { postId } }),
    }))),
  ]);

  return NextResponse.json({
    deleted: results.reduce((sum, count) => sum + count, 0),
    reactionCounts,
    commentCounts,
  });
}
