import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { instances } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { env } from "~/env";

export async function DELETE(
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

    // Call Go backend to terminate the VM
    try {
      const deleteResponse = await fetch(`${env.VM_PROVISIONER_URL}/vm/${instanceData.instanceId}?provider=${instanceData.provider}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error("Go backend delete error:", errorText);
        // Continue with database update even if cloud termination fails
      }

      console.log(`VM ${instanceData.instanceId} deletion request sent to ${instanceData.provider}`);
    } catch (error) {
      console.error("Failed to call Go backend for deletion:", error);
      // Continue with database update even if cloud termination fails
    }

    // Update instance to terminated status in our database
    await db
      .update(instances)
      .set({
        status: "terminated",
        terminatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(instances.id, instanceId));

    console.log(`Instance ${instanceId} marked as terminated in database`);

    return NextResponse.json({ message: "Instance terminated successfully" });
  } catch (error) {
    console.error("Failed to terminate instance:", error);
    return NextResponse.json(
      { error: "Failed to terminate instance" },
      { status: 500 }
    );
  }
}