import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

type ForumReply = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  isAdmin?: boolean;
};

type ForumPost = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replies: ForumReply[];
  pinned?: boolean;
  resolved?: boolean;
};

function forumFile(id: string) {
  return path.join(process.cwd(), "private", `forum-${id}.json`);
}

async function readPosts(id: string): Promise<ForumPost[]> {
  try {
    const raw = await readFile(forumFile(id), "utf-8");
    return JSON.parse(raw) as ForumPost[];
  } catch {
    return [];
  }
}

async function writePosts(id: string, posts: ForumPost[]) {
  const file = forumFile(id);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(posts, null, 2), "utf-8");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const posts = await readPosts(id);
  return NextResponse.json({ posts });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, userId, userName, content, postId, replyId, password } = body as {
    action: string;
    userId?: string;
    userName?: string;
    content?: string;
    postId?: string;
    replyId?: string;
    password?: string;
  };

  const posts = await readPosts(id);

  if (action === "post") {
    if (!userId || !userName || !content?.trim()) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
    const post: ForumPost = {
      id: randomUUID(),
      userId,
      userName,
      content: content.trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
      replies: [],
    };
    posts.push(post);
    await writePosts(id, posts);
    return NextResponse.json({ post });
  }

  if (action === "reply") {
    if (!userId || !userName || !content?.trim() || !postId) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) return NextResponse.json({ error: "Question introuvable." }, { status: 404 });
    const isAdmin = password === ADMIN_PASSWORD;
    const reply: ForumReply = {
      id: randomUUID(),
      userId,
      userName: isAdmin ? "Admin" : userName,
      content: content.trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
      ...(isAdmin ? { isAdmin: true } : {}),
    };
    post.replies.push(reply);
    await writePosts(id, posts);
    return NextResponse.json({ reply });
  }

  // Admin-only actions
  if (!password || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (action === "pin") {
    const post = posts.find((p) => p.id === postId);
    if (!post) return NextResponse.json({ error: "Question introuvable." }, { status: 404 });
    post.pinned = !post.pinned;
    await writePosts(id, posts);
    return NextResponse.json({ pinned: post.pinned });
  }

  if (action === "resolve") {
    const post = posts.find((p) => p.id === postId);
    if (!post) return NextResponse.json({ error: "Question introuvable." }, { status: 404 });
    post.resolved = !post.resolved;
    await writePosts(id, posts);
    return NextResponse.json({ resolved: post.resolved });
  }

  if (action === "delete") {
    if (postId && !replyId) {
      const idx = posts.findIndex((p) => p.id === postId);
      if (idx === -1) return NextResponse.json({ error: "Question introuvable." }, { status: 404 });
      posts.splice(idx, 1);
    } else if (postId && replyId) {
      const post = posts.find((p) => p.id === postId);
      if (!post) return NextResponse.json({ error: "Question introuvable." }, { status: 404 });
      const ri = post.replies.findIndex((r) => r.id === replyId);
      if (ri !== -1) post.replies.splice(ri, 1);
    } else {
      return NextResponse.json({ error: "postId requis." }, { status: 400 });
    }
    await writePosts(id, posts);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
