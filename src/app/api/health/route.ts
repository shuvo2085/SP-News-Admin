import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/health — reports whether the app can reach the database.
// Public (no auth) so it can be checked before logging in.
export async function GET() {
  try {
    const users = await prisma.user.count();
    return NextResponse.json({ db: "ok", users });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    return NextResponse.json(
      {
        db: "error",
        code: e?.code ?? null,
        message: String(e?.message ?? err).slice(0, 600),
      },
      { status: 500 }
    );
  }
}
