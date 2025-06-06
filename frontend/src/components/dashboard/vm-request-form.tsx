"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

// Preset configurations
const PRESETS = [
  {
    id: "budget-dev",
    name: "📦 Budget Dev",
    description: "Basic CPU for development",
    provider: "hetzner",
    instanceType: "cpx11",
    hourlyRate: 0.005,
    creditsPerHour: ((0.005 * 100) * 1.5),
    specs: "2 vCPU, 2GB RAM"
  },
  {
    id: "aws-cpu-test",
    name: "☁️ AWS CPU Test",
    description: "Basic AWS instance for testing",
    provider: "aws", 
    instanceType: "t3.medium",
    hourlyRate: 0.0416,
    creditsPerHour: ((0.0416 * 100) * 1.5),
    specs: "2 vCPU, 4GB RAM (CPU only)"
  },
  {
    id: "testing-gpu",
    name: "🧪 Testing GPU", 
    description: "GPU for ML experimentation (needs GPU limits)",
    provider: "aws",
    instanceType: "g4dn.xlarge",
    hourlyRate: 0.526,
    creditsPerHour: ((0.526 * 100) * 1.5),
    specs: "4 vCPU, 16GB RAM, T4 GPU"
  },
  {
    id: "serious-training",
    name: "🔥 Serious Training",
    description: "Professional ML training",
    provider: "aws", 
    instanceType: "p3.2xlarge",
    hourlyRate: 3.06,
    creditsPerHour: ((3.06 * 100) * 1.5),
    specs: "8 vCPU, 61GB RAM, V100 GPU"
  },
  {
    id: "beast-mode",
    name: "💪 Beast Mode",
    description: "Maximum power for large models",
    provider: "aws",
    instanceType: "p4d.24xlarge", 
    hourlyRate: 32.77,
    creditsPerHour: ((32.77 * 100) * 1.5),
    specs: "96 vCPU, 1152GB RAM, 8x A100 GPU"
  },
  {
    id: "custom",
    name: "⚙️ Custom Config",
    description: "Choose your own configuration",
    provider: "custom",
    instanceType: "",
    hourlyRate: 0,
    creditsPerHour: 0,
    specs: "Configure manually"
  }
];

// Hetzner instance types (updated with real available types)
const HETZNER_INSTANCES = [
  { value: "cpx11", label: "cpx11 - 2 vCPU, 2GB RAM", hourlyRate: 0.005, creditsPerHour: ((0.005 * 100) * 1.5), provider: "hetzner" },
  { value: "cpx21", label: "cpx21 - 3 vCPU, 4GB RAM", hourlyRate: 0.008, creditsPerHour: ((0.008 * 100) * 1.5), provider: "hetzner" },
  { value: "cpx31", label: "cpx31 - 4 vCPU, 8GB RAM", hourlyRate: 0.015, creditsPerHour: ((0.015 * 100) * 1.5), provider: "hetzner" },
  { value: "cx22", label: "cx22 - 2 vCPU, 4GB RAM", hourlyRate: 0.006, creditsPerHour: ((0.006 * 100) * 1.5), provider: "hetzner" },
  { value: "cx32", label: "cx32 - 4 vCPU, 8GB RAM", hourlyRate: 0.012, creditsPerHour: ((0.012 * 100) * 1.5), provider: "hetzner" },
  { value: "cx42", label: "cx42 - 8 vCPU, 16GB RAM", hourlyRate: 0.024, creditsPerHour: ((0.024 * 100) * 1.5), provider: "hetzner" },
  { value: "cx52", label: "cx52 - 16 vCPU, 32GB RAM", hourlyRate: 0.048, creditsPerHour: ((0.048 * 100) * 1.5), provider: "hetzner" },
];

// AWS CPU instances  
const AWS_CPU_INSTANCES = [
  { value: "t3.micro", label: "t3.micro - 1 vCPU, 1GB RAM", hourlyRate: 0.0104, creditsPerHour: ((0.0104 * 100) * 1.5), provider: "aws" },
  { value: "t3.small", label: "t3.small - 2 vCPU, 2GB RAM", hourlyRate: 0.0208, creditsPerHour: ((0.0208 * 100) * 1.5), provider: "aws" },
  { value: "t3.medium", label: "t3.medium - 2 vCPU, 4GB RAM", hourlyRate: 0.0416, creditsPerHour: ((0.0416 * 100) * 1.5), provider: "aws" },
  { value: "t3.large", label: "t3.large - 2 vCPU, 8GB RAM", hourlyRate: 0.0832, creditsPerHour: ((0.0832 * 100) * 1.5), provider: "aws" },
  { value: "t3.xlarge", label: "t3.xlarge - 4 vCPU, 16GB RAM", hourlyRate: 0.1664, creditsPerHour: ((0.1664 * 100) * 1.5), provider: "aws" },
];

// AWS GPU instances
const AWS_GPU_INSTANCES = [
  { value: "g4dn.xlarge", label: "g4dn.xlarge - 4 vCPU, 16GB RAM, T4 GPU", hourlyRate: 0.526, spotPrice: 0.15, creditsPerHour: ((0.526 * 100) * 1.5), creditsPerHourSpot: ((0.15 * 100) * 1.5), provider: "aws" },
  { value: "g4dn.2xlarge", label: "g4dn.2xlarge - 8 vCPU, 32GB RAM, T4 GPU", hourlyRate: 0.752, spotPrice: 0.22, creditsPerHour: ((0.752 * 100) * 1.5), creditsPerHourSpot: ((0.22 * 100) * 1.5), provider: "aws" },
  { value: "p3.2xlarge", label: "p3.2xlarge - 8 vCPU, 61GB RAM, V100 GPU", hourlyRate: 3.06, spotPrice: 1.0, creditsPerHour: ((3.06 * 100) * 1.5), creditsPerHourSpot: ((1.0 * 100) * 1.5), provider: "aws" },
  { value: "p3.8xlarge", label: "p3.8xlarge - 32 vCPU, 244GB RAM, 4x V100 GPU", hourlyRate: 12.24, spotPrice: 4.0, creditsPerHour: ((12.24 * 100) * 1.5), creditsPerHourSpot: ((4.0 * 100) * 1.5), provider: "aws" },
  { value: "p4d.24xlarge", label: "p4d.24xlarge - 96 vCPU, 1152GB RAM, 8x A100 GPU", hourlyRate: 32.77, spotPrice: 10.0, creditsPerHour: ((32.77 * 100) * 1.5), creditsPerHourSpot: ((10.0 * 100) * 1.5), provider: "aws" },
];

const AWS_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
];

const HETZNER_REGIONS = [
  { value: "nbg1", label: "Nuremberg, Germany" },
  { value: "fsn1", label: "Falkenstein, Germany" },
  { value: "hel1", label: "Helsinki, Finland" },
  { value: "ash", label: "Ashburn, USA" },
];

interface VmRequestFormProps {
  onSubmit: (data: VmRequestData) => void;
  isLoading?: boolean;
}

export interface VmRequestData {
  name: string;
  provider: string;
  instanceType: string;
  region: string;
  useSpotInstance?: boolean;
  image?: string;
}

export default function VmRequestForm({ onSubmit, isLoading = false }: VmRequestFormProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("aws-cpu-test");
  const [showCustomConfig, setShowCustomConfig] = useState<boolean>(false);
  const [formData, setFormData] = useState<VmRequestData>({
    name: "",
    provider: "aws",
    instanceType: "t3.medium",
    region: "us-east-1",
    useSpotInstance: false,
    image: "",
  });

  // Update form when preset changes
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PRESETS.find(p => p.id === presetId);
    
    if (preset && preset.id !== "custom") {
      setShowCustomConfig(false);
      setFormData(prev => ({
        ...prev,
        provider: preset.provider,
        instanceType: preset.instanceType,
        region: preset.provider === "aws" ? "us-east-1" : "nbg1",
        useSpotInstance: false, // Disable spot instances for now
        image: "", // Let the backend choose the correct AMI
      }));
    } else {
      setShowCustomConfig(true);
    }
  };

  // Get available instances based on provider
  const getAvailableInstances = () => {
    if (formData.provider === "hetzner") return HETZNER_INSTANCES;
    if (formData.provider === "aws") return [...AWS_CPU_INSTANCES, ...AWS_GPU_INSTANCES];
    return [];
  };

  // Get available regions based on provider
  const getAvailableRegions = () => {
    return formData.provider === "aws" ? AWS_REGIONS : HETZNER_REGIONS;
  };

  // Get current hourly rate in credits (converted from USD to credits)
  const getCurrentHourlyCredits = () => {
    const instances = getAvailableInstances();
    const selectedInstance = instances.find(i => i.value === formData.instanceType);
    if (!selectedInstance) return 0;
    
    let rateUsd = selectedInstance.hourlyRate;
    if (formData.useSpotInstance && 'spotPrice' in selectedInstance && typeof selectedInstance.spotPrice === 'number' && selectedInstance.spotPrice > 0) {
      rateUsd = selectedInstance.spotPrice;
    }
    
    // Convert USD to credits: $0.0416/hr = 4.16 cents/hr = 4.16 credits/hr base cost
    // With 50% markup: 4.16 * 1.5 = 6.24 credits/hr
    return (rateUsd * 100) * 1.5;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof VmRequestData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedPresetInfo = PRESETS.find(p => p.id === selectedPreset);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Launch Virtual Machine</CardTitle>
        <CardDescription>
          Choose a preset configuration or customize your own setup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* VM Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              VM Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="my-gpu-training-vm"
              required
            />
          </div>

          {/* Preset Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Configuration</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPreset === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePresetChange(preset.id)}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="preset"
                      value={preset.id}
                      checked={selectedPreset === preset.id}
                      onChange={() => handlePresetChange(preset.id)}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                      <div className="text-xs text-gray-600 mt-1">{preset.specs}</div>
                      {preset.creditsPerHour > 0 && (
                        <div className="text-xs font-mono text-orange-600">
                          {preset.creditsPerHour.toFixed(1)} credits/hour
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Configuration */}
          {showCustomConfig && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm">Custom Configuration</h4>
              
              {/* Provider Selection */}
              <div className="space-y-2">
                <label htmlFor="provider" className="text-sm font-medium">Provider</label>
                <select
                  id="provider"
                  value={formData.provider}
                  onChange={handleChange("provider")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="hetzner">Hetzner Cloud (CPU, Cheaper)</option>
                  <option value="aws">AWS (CPU + GPU, More Options)</option>
                </select>
              </div>

              {/* Instance Type */}
              <div className="space-y-2">
                <label htmlFor="instanceType" className="text-sm font-medium">Instance Type</label>
                <select
                  id="instanceType"
                  value={formData.instanceType}
                  onChange={handleChange("instanceType")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {getAvailableInstances().map(instance => (
                    <option key={instance.value} value={instance.value}>
                      {instance.label} - {instance.creditsPerHour.toFixed(1)} credits/hr
                      {'creditsPerHourSpot' in instance && typeof instance.creditsPerHourSpot === 'number' && instance.creditsPerHourSpot > 0 && ` (Spot: ${instance.creditsPerHourSpot.toFixed(1)} credits/hr)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Spot Instance Option (AWS only) */}
              {formData.provider === "aws" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useSpotInstance"
                    checked={formData.useSpotInstance}
                    onChange={handleChange("useSpotInstance")}
                    className="text-blue-600"
                  />
                  <label htmlFor="useSpotInstance" className="text-sm">
                    Use Spot Instance (up to 70% cheaper, may be interrupted)
                  </label>
                </div>
              )}

              {/* Region */}
              <div className="space-y-2">
                <label htmlFor="region" className="text-sm font-medium">Region</label>
                <select
                  id="region"
                  value={formData.region}
                  onChange={handleChange("region")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {getAvailableRegions().map(region => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}


          {/* Cost Information */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-md border">
            <h4 className="font-medium text-sm mb-2">💰 Billing Information</h4>
            {selectedPresetInfo && selectedPresetInfo.id !== "custom" ? (
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{selectedPresetInfo.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-mono text-lg text-orange-600">{selectedPresetInfo.creditsPerHour.toFixed(1)} credits/hour</span>
                </p>
                <p className="text-xs text-gray-500">
                  ~{Math.round(selectedPresetInfo.creditsPerHour * 24 * 30).toLocaleString()} credits/month
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  VM will run until terminated or credits are exhausted
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Billing rate: <span className="font-mono text-lg text-orange-600">{getCurrentHourlyCredits().toFixed(1)} credits/hour</span>
                </p>
                <p className="text-xs text-gray-500">
                  ~{Math.round(getCurrentHourlyCredits() * 24 * 30).toLocaleString()} credits/month
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  VM will run until terminated or credits are exhausted
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              💡 Your VM will automatically terminate if your credit balance goes below -100 credits
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? "🚀 Launching VM..." : "🚀 Launch Virtual Machine"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}