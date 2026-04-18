import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { buildCoordinatorInterventions } from "@/src/lib/coordinatorBackend";

/**
 * GET /api/coordinator/interventions?limit=200
 * Institution-wide intervention records and effectiveness summary.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const limitParam = request.nextUrl.searchParams.get("limit");
    const parsedLimit = Number(limitParam);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), 1000)
      : 300;

    const { interventions, metrics } = await buildCoordinatorInterventions(limit);

    return NextResponse.json({
      success: true,
      data: {
        interventions,
        metrics,
      },
    });
  } catch (error) {
    console.error("Coordinator interventions API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load intervention data" },
      { status: 500 }
    );
  }
}
