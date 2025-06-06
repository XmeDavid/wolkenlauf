import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { instances } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { env } from "~/env";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instanceId = params.id;

    // Verify the instance belongs to the user
    const instance = await db
      .select()
      .from(instances)
      .where(and(eq(instances.id, instanceId), eq(instances.userId, userId)))
      .limit(1);

    if (!instance[0]) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    const instanceData = instance[0];

    console.log(`🔄 Syncing status for ${instanceData.name} (${instanceData.instanceId})`);

    // Get actual status from cloud provider
    try {
      const statusResponse = await fetch(`${env.VM_PROVISIONER_URL}/vm/${instanceData.instanceId}/status?provider=${instanceData.provider}`);

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Failed to get VM status:", errorText);
        return NextResponse.json(
          { error: `Failed to get VM status: ${errorText}` },
          { status: 500 }
        );
      }

      const status = await statusResponse.json() as {
        status: string;
        publicIp?: string;
      };

      console.log(`📊 Actual cloud status: ${status.status}, IP: ${status.publicIp}`);

      // Update database with actual status
      const updateResult = await db
        .update(instances)
        .set({
          status: status.status,
          publicIp: status.publicIp ?? instanceData.publicIp,
          // Clear terminatedAt if VM is actually running
          terminatedAt: status.status === "running" ? null : instanceData.terminatedAt,
          updatedAt: new Date(),
        })
        .where(eq(instances.id, instanceId))
        .returning();

      console.log(`✅ Synced status from ${instanceData.status} to ${status.status}`);

      return NextResponse.json({
        message: "Status synced successfully",
        oldStatus: instanceData.status,
        newStatus: status.status,
        instance: updateResult[0],
      });

    } catch (error) {
      console.error("Failed to sync status:", error);
      return NextResponse.json(
        { error: "Failed to connect to VM provisioner service" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to sync instance status:", error);
    return NextResponse.json(
      { error: "Failed to sync status" },
      { status: 500 }
    );
  }
}