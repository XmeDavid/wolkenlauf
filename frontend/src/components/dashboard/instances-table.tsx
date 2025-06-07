"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TableHead, TableRow, TableHeader, TableBody, Table } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useState, useEffect } from "react";

interface Instance {
  id: string;
  name: string;
  provider: string;
  instanceType: string;
  region: string;
  status: string;
  publicIp?: string;
  sshUsername?: string;
  sshPassword?: string;
  useSpotInstance?: boolean;
  createdAt: string;
  launchedAt?: string;
}

async function fetchInstances(): Promise<Instance[]> {
  const response = await fetch('/api/instances');
  if (!response.ok) {
    throw new Error('Failed to fetch instances');
  }
  return response.json();
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    running: "default", 
    stopped: "secondary",
    terminated: "destructive",
  };

  return (
    <Badge variant={variants[status] || "outline"}>
      {status}
    </Badge>
  );
}

// Component to display running cost for an instance
function RunningCostDisplay({ instance }: { instance: Instance }) {
  const [runningCost, setRunningCost] = useState<number>(0);
  const [startTime] = useState<Date>(new Date(instance.createdAt));
  
  // Calculate hourly rate based on instance type and provider
  const getHourlyRate = () => {
    const hetznerRates: Record<string, number> = {
      "cpx11": 0.005, "cpx21": 0.008, "cpx31": 0.015,
      "cx22": 0.006, "cx32": 0.012, "cx42": 0.024, "cx52": 0.048,
    };
    
    const awsRates: Record<string, { onDemand: number; spot?: number }> = {
      "t3.micro": { onDemand: 0.0104 },
      "t3.small": { onDemand: 0.0208 },
      "t3.medium": { onDemand: 0.0416 },
      "t3.large": { onDemand: 0.0832 },
      "t3.xlarge": { onDemand: 0.1664 },
      "g4dn.xlarge": { onDemand: 0.526, spot: 0.15 },
      "g4dn.2xlarge": { onDemand: 0.752, spot: 0.22 },
      "p3.2xlarge": { onDemand: 3.06, spot: 1.0 },
      "p3.8xlarge": { onDemand: 12.24, spot: 4.0 },
      "p4d.24xlarge": { onDemand: 32.77, spot: 10.0 },
    };
    
    if (instance.provider === "hetzner") {
      return hetznerRates[instance.instanceType] || 0;
    }
    
    if (instance.provider === "aws") {
      const rates = awsRates[instance.instanceType];
      if (!rates) return 0;
      return instance.useSpotInstance && rates.spot ? rates.spot : rates.onDemand;
    }
    
    return 0;
  };
  
  useEffect(() => {
    if (instance.status !== "running") {
      return;
    }
    
    const updateCost = () => {
      const now = new Date();
      const runtimeHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const hourlyRateUsd = getHourlyRate();
      const creditsPerHour = (hourlyRateUsd * 100) * 1.5; // Convert $ to cents, then 50% markup
      const totalCost = runtimeHours * creditsPerHour;
      setRunningCost(totalCost);
    };
    
    // Delay initial calculation to avoid hydration mismatch
    const timer = setTimeout(() => {
      updateCost();
      const interval = setInterval(updateCost, 30000);
      return () => clearInterval(interval);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [instance.status, startTime]);
  
  if (instance.status !== "running") {
    return <span className="text-gray-500 text-sm">-</span>;
  }
  
  return (
    <div className="text-sm">
      <div className="font-mono text-orange-600">
        {Math.ceil(runningCost)} credits
      </div>
      <div className="text-xs text-gray-500">
        {((getHourlyRate() * 100) * 1.5).toFixed(1)} credits/hr
      </div>
    </div>
  );
}

function InstanceRow({ instance }: { instance: Instance }) {
  const queryClient = useQueryClient();

  const terminateMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await fetch(`/api/instances/${instanceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to terminate instance');
      }
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instances'] });
    },
    onError: (error) => {
      console.error('Failed to terminate instance:', error);
      alert('Failed to terminate instance. Please try again.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await fetch(`/api/instances/${instanceId}?action=remove`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove instance');
      }
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instances'] });
    },
    onError: (error) => {
      console.error('Failed to remove instance:', error);
      alert('Failed to remove instance. Please try again.');
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await fetch(`/api/instances/${instanceId}/sync`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to sync status');
      }
      return response.json();
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['instances'] });
      alert(`Status synced: ${data.oldStatus} → ${data.newStatus}`);
    },
    onError: (error) => {
      console.error('Failed to sync status:', error);
      alert('Failed to sync status. Please try again.');
    },
  });

  const handleConnect = () => {
    if (instance.publicIp && instance.sshUsername && instance.sshPassword) {
      const sshCommand = `ssh ${instance.sshUsername}@${instance.publicIp}`;
      void navigator.clipboard.writeText(sshCommand);
      alert(`SSH command copied to clipboard!\n\nCommand: ${sshCommand}\nPassword: ${instance.sshPassword}`);
    }
  };

  const handleTerminate = () => {
    if (confirm(`Are you sure you want to terminate "${instance.name}"? This cannot be undone.`)) {
      terminateMutation.mutate(instance.id);
    }
  };

  const handleRemove = () => {
    if (confirm(`Remove "${instance.name}" from your list? This will only remove it from the UI - the VM is already terminated.`)) {
      removeMutation.mutate(instance.id);
    }
  };

  const handleSync = () => {
    syncMutation.mutate(instance.id);
  };

  return (
    <TableRow key={instance.id}>
      <td className="px-4 py-2 font-medium">{instance.name}</td>
      <td className="px-4 py-2">
        <StatusBadge status={instance.status} />
      </td>
      <td className="px-4 py-2 hidden md:table-cell">
        <div className="flex flex-col">
          <span className="font-medium">{instance.instanceType}</span>
          <span className="text-xs text-gray-500 capitalize">
            {instance.provider}
            {instance.useSpotInstance && instance.provider === 'aws' && ' (Spot)'}
          </span>
        </div>
      </td>
      <td className="px-4 py-2 hidden md:table-cell">{instance.region}</td>
      <td className="px-4 py-2 hidden md:table-cell">
        {instance.publicIp || '-'}
      </td>
      <td className="px-4 py-2 hidden lg:table-cell">
        <RunningCostDisplay instance={instance} />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          {instance.status === 'running' && instance.publicIp && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleConnect}
            >
              Connect
            </Button>
          )}
          {instance.status !== 'terminated' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleTerminate}
              disabled={terminateMutation.isPending}
            >
              {terminateMutation.isPending ? 'Terminating...' : 'Terminate'}
            </Button>
          )}
          {instance.status === 'terminated' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="text-blue-600 hover:text-blue-800"
              >
                {syncMutation.isPending ? 'Syncing...' : 'Sync Status'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemove}
                disabled={removeMutation.isPending}
                className="text-gray-600 hover:text-red-600"
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </>
          )}
        </div>
      </td>
    </TableRow>
  );
}

interface InstancesTableProps {
  onRefresh?: () => void;
}

export default function InstancesTable({ onRefresh }: InstancesTableProps) {
  const router = useRouter();
  const { data: instances, isLoading, error, refetch } = useQuery({
    queryKey: ['instances'],
    queryFn: fetchInstances,
    refetchInterval: 5000, // Poll every 5 seconds to update status
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600">Loading your virtual machines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Failed to load VMs
            </h3>
            <p className="text-red-600 text-sm mb-4">
              {error instanceof Error ? error.message : "Something went wrong while loading your virtual machines."}
            </p>
            <div className="space-y-2">
              <Button onClick={() => void refetch()} className="w-full">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h3 className="text-lg font-medium mb-2">No virtual machines yet</h3>
        <p className="text-sm">Launch your first VM to get started with cloud development</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead className="hidden md:table-cell">Region</TableHead>
          <TableHead className="hidden md:table-cell">Public IP</TableHead>
          <TableHead className="hidden lg:table-cell">Runtime Cost</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instances.map((instance) => (
          <InstanceRow key={instance.id} instance={instance} />
        ))}
      </TableBody>
    </Table>
  );
}