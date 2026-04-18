import { NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { getInterventionAnalytics } from "@/src/lib/coordinatorService";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const data = await getInterventionAnalytics();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Coordinator intervention analytics API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load intervention analytics" },
      { status: 500 }
    );
  }
}
