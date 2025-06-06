import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { instances } from "~/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { env } from "~/env";
import { softDeleteInstance } from "~/server/db/queries/instances";

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
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Verify the instance belongs to the user (excluding soft deleted)
    const instance = await db
      .select()
      .from(instances)
      .where(and(eq(instances.id, instanceId), eq(instances.userId, userId)))
      .limit(1);

    if (!instance[0]) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    const instanceData = instance[0];

    if (action === 'remove') {
      // Hard delete from database (for terminated instances) - temporary until soft delete is implemented
      if (instanceData.status !== 'terminated') {
        return NextResponse.json(
          { error: "Can only remove terminated instances" }, 
          { status: 400 }
        );
      }

      await db
        .delete(instances)
        .where(eq(instances.id, instanceId));

      console.log(`Instance ${instanceId} removed from database`);
      return NextResponse.json({ message: "Instance removed successfully" });
    } else {
      // Terminate the VM (default action)
      if (instanceData.status === 'terminated') {
        return NextResponse.json(
          { error: "Instance is already terminated" }, 
          { status: 400 }
        );
      }

      // Call Go backend to terminate the VM
      try {
        const deleteResponse = await fetch(`${env.VM_PROVISIONER_URL}/vm/${instanceData.instanceId}?provider=${instanceData.provider}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error("Go backend delete error:", errorText);
          return NextResponse.json(
            { error: `Failed to terminate VM: ${errorText}` },
            { status: 500 }
          );
        }

        console.log(`VM ${instanceData.instanceId} deletion request sent to ${instanceData.provider}`);
      } catch (error) {
        console.error("Failed to call Go backend for deletion:", error);
        return NextResponse.json(
          { error: "Failed to connect to VM provisioner service" },
          { status: 500 }
        );
      }

      // Only update database if cloud termination succeeded
      await db
        .update(instances)
        .set({
          status: "terminated",
          terminatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(instances.id, instanceId));

      console.log(`Instance ${instanceId} successfully terminated and marked in database`);
      return NextResponse.json({ message: "Instance terminated successfully" });
    }
  } catch (error) {
    console.error("Failed to process instance deletion:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}