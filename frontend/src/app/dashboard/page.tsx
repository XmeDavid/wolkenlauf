'use client';
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import VmRequestForm, { type VmRequestData } from "~/components/dashboard/vm-request-form";
import InstancesTable from "~/components/dashboard/instances-table";

export default function Dashboard() {
  const [showVmForm, setShowVmForm] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const router = useRouter();

  const handleVmRequest = async (data: VmRequestData) => {
    setIsLaunching(true);
    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create instance');
      }

      const newInstance = await response.json();
      console.log('VM launched successfully:', newInstance);
      setShowVmForm(false);
      
      // TODO: Refresh instances list or show success message
    } catch (error) {
      console.error('Failed to launch VM:', error);
      alert('Failed to launch VM. Please try again.');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <section className="h-full w-full flex flex-col">
      <div className="flex h-16 lg:h-[70px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
        <h2 className="text-lg font-semibold">Virtual Machines</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/profile')}>
            💳 Credits & Profile
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">My Virtual Machines</h1>
          <Button 
            className="ml-auto" 
            size="sm" 
            onClick={() => setShowVmForm(true)}
          >
            Launch New VM
          </Button>
        </div>

        {showVmForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Launch Virtual Machine</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVmForm(false)}
                  disabled={isLaunching}
                >
                  Cancel
                </Button>
              </div>
              <VmRequestForm 
                onSubmit={handleVmRequest} 
                isLoading={isLaunching}
              />
            </div>
          </div>
        )}

        <div className="border shadow-sm rounded-lg">
          <InstancesTable />
        </div>
      </div>
    </section>
  );
}
