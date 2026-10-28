import { NextResponse } from "next/server";
import { loadHistory } from "@/lib/history";
import { clampCoordinates } from "@/lib/places";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = clampCoordinates(Number(searchParams.get("lat")), Number(searchParams.get("lon")));
  const date = searchParams.get("date") ?? "";
  if (!coords || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const years = await loadHistory(coords.lat, coords.lon, date);
    return NextResponse.json(
      { date, years },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    const cause = error instanceof Error ? (error.cause as Error | undefined) : undefined;
    console.error(
      "history route failed",
      error instanceof Error ? error.message : error,
      cause?.message,
      (cause as { code?: string } | undefined)?.code,
    );
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
