import Image from "next/image";
import Link from "next/link";
import { Card } from "~/components/ui/card"
import { CollapsibleTrigger, CollapsibleContent, Collapsible } from "~/components/ui/collapsible"
import { CodeIcon, BoltIcon, GaugeIcon, CloudIcon, CheckIcon, ChevronDownIcon } from "~/components/icons";

export default function HomePage() {
  return (
    <>
      <main className="mx-auto my-12">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Unleash Your Coding Potential</h1>
            <p className="text-gray-600 dark:text-gray-400">
            Wolkenlauf is a powerful SaaS platform that allows you to manage and run your coding projects in the cloud.
              Forget about infrastructure management and focus on what you do best - coding.
            </p>
            <div className="flex gap-4">
              <Link
                className="inline-flex items-center justify-center rounded-md bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                href="/dashboard"
              >
                Get Started
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Image
              alt="Wolkenlauf Platform"
              className="rounded-lg object-cover"
              height="350"
              src="https://www.factioninc.com/wp-content/uploads/fly-images/17969/Enterprise-Cloud-Header-01-750x350-c.png"
              style={{
                aspectRatio: "750/350",
                objectFit: "cover",
              }}
              width="750"
            />
          </div>
        </div>
        <section className="container mt-12 mb-8 space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-950">
              <CloudIcon className="h-8 w-8 text-blue-500" />
              <h3 className="mt-4 text-lg font-semibold">Cloud-Powered Coding</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Run your coding projects in the cloud without worrying about infrastructure management.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-950">
              <GaugeIcon className="h-8 w-8 text-blue-500" />
              <h3 className="mt-4 text-lg font-semibold">Effortless Project Management</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your coding projects with ease, from version control to deployment.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-950">
              <BoltIcon className="h-8 w-8 text-blue-500" />
              <h3 className="mt-4 text-lg font-semibold">Blazing-Fast Deployment</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Deploy your code instantly with our lightning-fast cloud infrastructure.
              </p>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Pricing</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Pay only for the AI inference time you use. Choose the hardware tier that fits your needs.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            <Card className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">CPU</h3>
                <p className="text-gray-500 dark:text-gray-400">Cost-effective CPU-based inference.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-4xl font-bold">$0.0001</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per second</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    Up to 2 CPU cores
                  </li>
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    Up to 4 GB RAM
                  </li>
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    No GPU access
                  </li>
                </ul>
                <Link
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                  href="/dashboard"
                >
                  Get Started
                </Link>
              </div>
            </Card>
            <Card className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">GPU</h3>
                <p className="text-gray-500 dark:text-gray-400">GPU-accelerated inference for faster results.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-4xl font-bold">$0.0005</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per second</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    Up to 4 CPU cores
                  </li>
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    Up to 16 GB RAM
                  </li>
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    1 GPU for acceleration
                  </li>
                </ul>
                <Link
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                  href="/dashboard"
                >
                  Get Started
                </Link>
              </div>
            </Card>
            <Card className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">High-Performance</h3>
                <p className="text-gray-500 dark:text-gray-400">High-end hardware for demanding workloads.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-4xl font-bold">$0.0025</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per second</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    Up to 8 CPU cores
                  </li>
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    Up to 32 GB RAM
                  </li>
                  <li>
                    <CheckIcon className="mr-2 inline-block h-4 w-4 text-gray-900 dark:text-gray-50" />
                    2 GPUs for acceleration
                  </li>
                </ul>
                <Link
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                  href="/dashboard"
                >
                  Get Started
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Got questions about our pricing or services? Check out our FAQ.
              </p>
            </div>
            <div className="mx-auto w-full max-w-3xl space-y-4">
              <Collapsible className="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <h4 className="text-lg font-medium">How is the pay-as-you-go pricing structured?</h4>
                  <ChevronDownIcon className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Our pay-as-you-go pricing is based on the actual time your AI models run on our infrastructure.
                    You'll be charged a per-second rate based on the hardware tier you choose - CPU, GPU, or
                    High-Performance. This allows you to scale your usage up or down as needed without any fixed monthly
                    fees.
                  </p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible className="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <h4 className="text-lg font-medium">Can I switch between hardware tiers?</h4>
                  <ChevronDownIcon className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Yes, you can switch between hardware tiers at any time. Simply select the tier that best fits your
                    current workload and you'll be charged the corresponding per-second rate. This flexibility allows
                    you to optimize your costs as your needs change.
                  </p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible className="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <h4 className="text-lg font-medium">Do you offer any discounts or volume pricing?</h4>
                  <ChevronDownIcon className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Yes, we do offer volume discounts for customers with high usage. The more you use our platform, the
                    lower your per-second rate will be. We also have special pricing for academic and non-profit
                    organizations. Contact our sales team to learn more about our discount programs.
                  </p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible className="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <h4 className="text-lg font-medium">Do you offer any free trials or money-back guarantees?</h4>
                  <ChevronDownIcon className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Yes, we offer a 30-day money-back guarantee on all of our services. If you're not satisfied with our
                    platform, you can request a full refund. We also provide a 14-day free trial for new customers to
                    test out our capabilities.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </section>
      </main>
      <footer className="bg-gray-900 py-8 text-white fixed bottom-0 w-full">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <CodeIcon className="h-6 w-6" />
              <span className="text-lg font-semibold">Wolkenlauf</span>
            </div>
            <nav className="flex gap-4">
              <Link className="hover:underline" href="/dashboard">
                Dashboard
              </Link>
              <Link className="hover:underline" href="/pricing">
                Pricing
              </Link>
              <Link className="hover:underline" href="/contact">
                Contact
              </Link>
            </nav>
          </div>
          <p className="mt-4 text-center text-sm text-gray-400">© 2024 Wolkenlauf. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
