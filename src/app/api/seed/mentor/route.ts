import { NextResponse } from "next/server";

/**
 * POST /api/seed/mentor
 * Redirects to the main seed route — all data is now seeded from /api/seed
 */
export async function POST() {
  return NextResponse.json({
    success: false,
    message: "This endpoint has been consolidated into /api/seed. Please use POST /api/seed instead.",
  }, { status: 301 });
}
