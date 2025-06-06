"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TableHead, TableRow, TableHeader, TableBody, Table } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

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
  const { data: instances, isLoading, error, refetch } = useQuery({
    queryKey: ['instances'],
    queryFn: fetchInstances,
    refetchInterval: 5000, // Poll every 5 seconds to update status
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Loading instances...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Failed to load instances. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
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