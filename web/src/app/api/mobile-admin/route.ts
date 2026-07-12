import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/mobile-backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") ?? "stats";
  try {
    if (resource === "stats") {
      return NextResponse.json(await backendAdminFetch("/v1/admin/stats/overview"));
    }
    if (resource === "riders") {
      return NextResponse.json(await backendAdminFetch("/v1/admin/riders"));
    }
    if (resource === "drivers") {
      return NextResponse.json(await backendAdminFetch("/v1/admin/drivers"));
    }
    if (resource === "pending-drivers") {
      return NextResponse.json(await backendAdminFetch("/v1/admin/drivers/pending"));
    }
    if (resource === "live-rides") {
      return NextResponse.json(await backendAdminFetch("/v1/admin/rides/live"));
    }
    if (resource === "sos") {
      return NextResponse.json(await backendAdminFetch("/v1/admin/sos/recent"));
    }
    if (resource === "recordings") {
      return NextResponse.json(await backendAdminFetch("/v1/admin/recordings/recent"));
    }
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backend fetch failed" },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, driverId } = body as { action?: string; driverId?: string };
    if (action === "approve-driver" && driverId) {
      return NextResponse.json(await backendAdminFetch(`/v1/admin/drivers/${driverId}/approve`, { method: "POST" }));
    }
    if (action === "reject-driver" && driverId) {
      return NextResponse.json(await backendAdminFetch(`/v1/admin/drivers/${driverId}/reject`, { method: "POST" }));
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backend action failed" },
      { status: 502 },
    );
  }
}
