import { NextRequest, NextResponse } from "next/server";
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

    const body = await request.json();
    const { name, provider, instanceType, region, autoTerminateMinutes, useSpotInstance, image } = body;

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
      useSpotInstance: useSpotInstance || false,
      image: image || "", // Let Go backend choose correct AMI
      autoTerminateMinutes: parseInt(autoTerminateMinutes?.toString() || "60", 10),
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

      const vmResponse = await goBackendResponse.json();
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
          useSpotInstance: useSpotInstance || false,
          image: vmResponse.image || vmRequest.image,
          autoTerminateMinutes: parseInt(autoTerminateMinutes?.toString() || "60", 10),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Start monitoring the VM status
      setTimeout(async () => {
        try {
          await monitorVmStatus(newInstance[0]!.id, vmResponse.id, provider);
        } catch (error) {
          console.error("Failed to start VM monitoring:", error);
        }
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

  const checkStatus = async () => {
    try {
      const statusResponse = await fetch(`${env.VM_PROVISIONER_URL}/vm/${cloudInstanceId}/status?provider=${provider}`);
      
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        
        // Update our database with the latest status
        await db
          .update(instances)
          .set({
            status: status.status,
            publicIp: status.publicIp || undefined,
            launchedAt: status.status === "running" ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(instances.id, dbInstanceId));

        console.log(`VM ${cloudInstanceId} status: ${status.status}, IP: ${status.publicIp}`);

        // Continue monitoring if still pending
        if (status.status === "pending" && attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        }
      }
    } catch (error) {
      console.error("Error monitoring VM status:", error);
      if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkStatus, 10000);
      }
    }
  };

  checkStatus();
}

function generateRandomPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}