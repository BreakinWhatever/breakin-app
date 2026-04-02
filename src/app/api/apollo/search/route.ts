import { searchPeople } from "@/lib/apollo";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, city, sector, page, perPage } = body;

    const result = await searchPeople({
      title,
      city,
      sector,
      page,
      perPage,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/apollo/search error:", message);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
