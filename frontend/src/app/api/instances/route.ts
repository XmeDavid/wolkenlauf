import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { instances } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "~/env";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userInstances = await db
      .select()
      .from(instances)
      .where(eq(instances.userId, userId))
      .orderBy(instances.createdAt);

    return NextResponse.json(userInstances);
  } catch (error) {
    console.error("Failed to fetch instances:", error);
    return NextResponse.json(
      { error: "Failed to fetch instances" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      name: string;
      provider: string;
      instanceType: string;
      region: string;
      useSpotInstance?: boolean;
      image?: string;
    };
    const { name, provider, instanceType, region, useSpotInstance, image } = body;

    // Validate required fields
    if (!name || !provider || !instanceType || !region) {
      return NextResponse.json(
        { error: "Missing required fields: name, provider, instanceType, region" },
        { status: 400 }
      );
    }

    // Call Go backend to provision the VM
    const vmRequest = {
      name,
      provider,
      instanceType,
      region,
      useSpotInstance: useSpotInstance ?? false,
      image: image ?? "", // Let Go backend choose correct AMI
      userId,
    };

    console.log("Calling Go backend to create VM:", vmRequest);
    console.log("UserId from auth:", userId);

    // Validate that we have a user ID
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    try {
      const goBackendResponse = await fetch(`${env.VM_PROVISIONER_URL}/vm/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vmRequest),
      });

      if (!goBackendResponse.ok) {
        const errorText = await goBackendResponse.text();
        throw new Error(`Go backend error: ${goBackendResponse.status} - ${errorText}`);
      }

      const vmResponse = await goBackendResponse.json() as {
        id: string;
        name: string;
        provider: string;
        instanceType: string;
        region: string;
        status: string;
        publicIp: string;
        sshUsername: string;
        sshPassword: string;
        image?: string;
      };
      console.log("Go backend response:", vmResponse);

      // Store the VM info in our database
      const newInstance = await db
        .insert(instances)
        .values({
          userId,
          name: vmResponse.name,
          provider: vmResponse.provider,
          instanceType: vmResponse.instanceType,
          region: vmResponse.region,
          instanceId: vmResponse.id, // Store the cloud provider's instance ID
          status: vmResponse.status,
          publicIp: vmResponse.publicIp,
          sshUsername: vmResponse.sshUsername,
          sshPassword: vmResponse.sshPassword,
          useSpotInstance: useSpotInstance ?? false,
          image: vmResponse.image ?? vmRequest.image,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create initial usage record for billing tracking
      try {
        const { usageRecords } = await import("~/server/db/schema");
        await db
          .insert(usageRecords)
          .values({
            userId,
            instanceId: newInstance[0]!.id,
            startTime: new Date(),
            creditsCharged: "0.00",
            cloudCostUsd: "0.0000",
            instanceType: instanceType || "unknown",
            provider: provider || "unknown",
            region: region || "unknown",
          });
        console.log(`📝 Created usage record for VM ${newInstance[0]!.id}`);
      } catch (error) {
        console.error("Failed to create usage record:", error);
      }

      // Start monitoring the VM status
      setTimeout(() => {
        void (async () => {
          try {
            await monitorVmStatus(newInstance[0]!.id, vmResponse.id, provider);
          } catch (error) {
            console.error("Failed to start VM monitoring:", error);
          }
        })();
      }, 5000);

      return NextResponse.json(newInstance[0], { status: 201 });

    } catch (error) {
      console.error("Failed to create VM via Go backend:", error);
      return NextResponse.json(
        { error: `Failed to provision VM: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to create instance:", error);
    return NextResponse.json(
      { error: "Failed to create instance" },
      { status: 500 }
    );
  }
}

// Monitor VM status from Go backend
async function monitorVmStatus(dbInstanceId: string, cloudInstanceId: string, provider: string) {
  const maxAttempts = 60; // Monitor for up to 10 minutes
  let attempts = 0;

  console.log(`🔍 Starting monitoring for ${provider} VM ${cloudInstanceId} (DB ID: ${dbInstanceId})`);

  const checkStatus = async () => {
    attempts++;
    try {
      const statusUrl = `${env.VM_PROVISIONER_URL}/vm/${cloudInstanceId}/status?provider=${provider}`;
      console.log(`📡 [Attempt ${attempts}/${maxAttempts}] Checking status: ${statusUrl}`);
      
      const statusResponse = await fetch(statusUrl);
      
      if (statusResponse.ok) {
        const status = await statusResponse.json() as {
          status: string;
          publicIp?: string;
        };
        console.log(`📊 Go backend response:`, status);
        
        // Update our database with the latest status
        const updateResult = await db
          .update(instances)
          .set({
            status: status.status,
            publicIp: status.publicIp ?? undefined,
            launchedAt: status.status === "running" ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(instances.id, dbInstanceId))
          .returning();

        console.log(`📝 Updated DB for VM ${cloudInstanceId}: status=${status.status}, IP=${status.publicIp}`);
        console.log(`📝 DB update result:`, updateResult);

        // Continue monitoring if still pending/starting/initializing and within limits
        if ((status.status === "pending" || status.status === "starting" || status.status === "initializing") && attempts < maxAttempts) {
          console.log(`⏳ VM still ${status.status}, continuing monitoring in 10 seconds...`);
          setTimeout(() => void checkStatus(), 10000); // Check every 10 seconds
        } else if (status.status === "running") {
          console.log(`✅ VM ${cloudInstanceId} is now running! Monitoring complete.`);
        } else if (attempts >= maxAttempts) {
          console.log(`⚠️  Max monitoring attempts reached for VM ${cloudInstanceId}, final status: ${status.status}`);
        } else {
          console.log(`ℹ️  VM ${cloudInstanceId} reached final status: ${status.status}, monitoring complete.`);
        }
      } else {
        const errorText = await statusResponse.text();
        console.error(`❌ Status check failed: ${statusResponse.status} - ${errorText}`);
        
        if (attempts < maxAttempts) {
          console.log(`🔄 Retrying status check in 10 seconds...`);
          setTimeout(() => void checkStatus(), 10000);
        }
      }
    } catch (error) {
      console.error(`❌ Error monitoring VM status (attempt ${attempts}):`, error);
      if (attempts < maxAttempts) {
        console.log(`🔄 Retrying status check in 10 seconds...`);
        setTimeout(() => void checkStatus(), 10000);
      }
    }
  };

  void checkStatus();
}