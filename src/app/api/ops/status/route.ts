import { NextRequest } from "next/server";
import { buildOpsStatusSnapshot } from "@/lib/ops/status";

export async function GET(_request: NextRequest) {
  try {
    const snapshot = await buildOpsStatusSnapshot(process.cwd());
    return Response.json(snapshot);
  } catch (error) {
    console.error("GET /api/ops/status error:", error);
    return Response.json(
      { error: "Failed to fetch ops status" },
      { status: 500 }
    );
  }
}
