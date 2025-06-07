import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { instances } from "~/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { env } from "~/env";
import { softDeleteInstance, calculateInstanceCost, deductCredits, getInstance } from "~/server/db/queries/instances";

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
      // Soft delete from UI (preserves billing history)
      if (instanceData.status !== 'terminated') {
        return NextResponse.json(
          { error: "Can only remove terminated instances" }, 
          { status: 400 }
        );
      }

      // Use soft delete to preserve usage records for billing
      await softDeleteInstance(instanceId, userId);

      console.log(`Instance ${instanceId} soft deleted (preserved for billing)`);
      return NextResponse.json({ message: "Instance removed from UI successfully" });
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
      const terminationTime = new Date();
      await db
        .update(instances)
        .set({
          status: "terminated",
          terminatedAt: terminationTime,
          updatedAt: terminationTime,
        })
        .where(eq(instances.id, instanceId));

      // Calculate final billing for the terminated VM
      try {
        const updatedInstance = await getInstance(instanceId, userId);
        if (updatedInstance?.launchedAt) {
          const cost = calculateInstanceCost(updatedInstance);
          
          if (cost.creditsCharged > 0) {
            console.log(`💰 Billing ${cost.creditsCharged.toFixed(2)} credits for VM ${instanceId}`);
            
            const billingResult = await deductCredits(
              userId,
              cost.creditsCharged,
              `VM termination: ${updatedInstance.name} (${updatedInstance.provider} ${updatedInstance.instanceType}) - ${cost.runtimeHours.toFixed(2)}h`,
              instanceId
            );
            
            if (billingResult.success) {
              console.log(`✅ Successfully billed ${cost.creditsCharged.toFixed(2)} credits for terminated VM. New balance: ${billingResult.newBalance.toFixed(2)}`);
            } else {
              console.error(`❌ Failed to bill credits: ${billingResult.overdraft ? 'Overdraft limit exceeded' : 'Unknown error'}`);
            }
          } else {
            console.log(`ℹ️ No billing required for VM ${instanceId} (never launched or 0 runtime)`);
          }
        }
      } catch (billingError) {
        console.error(`❌ Failed to process billing for terminated VM ${instanceId}:`, billingError);
        // Don't fail the termination if billing fails
      }

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