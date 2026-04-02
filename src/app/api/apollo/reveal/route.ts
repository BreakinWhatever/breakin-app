import { revealPeople } from "@/lib/apollo";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personIds } = body;

    if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
      return Response.json({ error: "personIds array is required" }, { status: 400 });
    }

    const revealed = await revealPeople(personIds);

    return Response.json({
      revealed,
      count: revealed.length,
      requested: personIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
