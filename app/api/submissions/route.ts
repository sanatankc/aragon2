import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/src/server/db";
import { submissions } from "@/src/server/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { label } = body;

    const id = nanoid(12);

    await db.insert(submissions).values({
      id,
      label,
    });

    return NextResponse.json({ id, createdAt: new Date() }, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
