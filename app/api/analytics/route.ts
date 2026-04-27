import { NextResponse } from "next/server";

// TODO: Replace this with your real data source (e.g. Prisma, Supabase, etc.)
// Example: import { db } from "@/lib/db";

export async function GET() {
  try {
    // Replace this block with a real DB query when your data layer is ready:
    // const students = await db.student.findMany({
    //   select: { name: true, uploads: true, lastActive: true },
    //   orderBy: { lastActive: "desc" },
    // });

    const students = [
      { name: "Alice", uploads: 5, lastActive: 1 },
      { name: "Bob", uploads: 1, lastActive: 5 },
      { name: "Charlie", uploads: 2, lastActive: 2 },
    ];

    return NextResponse.json({ students });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}