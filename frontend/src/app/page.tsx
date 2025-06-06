import Image from "next/image";
import Link from "next/link";
import { Card } from "~/components/ui/card"
import { CollapsibleTrigger, CollapsibleContent, Collapsible } from "~/components/ui/collapsible"
import { CodeIcon, BoltIcon, GaugeIcon, CloudIcon, CheckIcon, ChevronDownIcon } from "~/components/icons";

export default function HomePage() {
  return (
    <>
      <main className="mx-auto my-12 min-h-screen">
        <section className="container grid grid-cols-1 gap-8 lg:grid-cols-2">
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
        </section>
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
                Simple credit-based pricing. Start free and scale as you grow. Credits never expire.
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-6xl py-12">
            {/* Main 3 cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 mb-8">
              {/* Free Plan */}
              <Card className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-900">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Free</h3>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$0</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">150 credits monthly</p>
                </div>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    150 credits per month
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    100 credit welcome bonus
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Access to all VM types
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    SSH access included
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    href="/dashboard"
                    className="block w-full rounded-lg bg-gray-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </Card>

              {/* Pro Plan */}
              <Card className="relative overflow-hidden rounded-xl border-2 border-purple-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-purple-600 dark:bg-gray-900">
                <div className="absolute -top-1 -right-1 bg-purple-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Popular
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro</h3>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$10</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">1,200 credits monthly</p>
                </div>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    1,200 credits per month
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    ~190 hours of t3.medium
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Advanced monitoring
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    href="/dashboard"
                    className="block w-full rounded-lg bg-purple-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
                  >
                    Choose Pro
                  </Link>
                </div>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative overflow-hidden rounded-xl border-2 border-emerald-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-emerald-600 dark:bg-gray-900">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise</h3>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$50</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">6,750 credits monthly</p>
                </div>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    6,750 credits per month
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    ~85 hours of GPU instances
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Dedicated support
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Custom integrations
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    href="/dashboard"
                    className="block w-full rounded-lg bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Contact Sales
                  </Link>
                </div>
              </Card>
            </div>

            {/* Expandable section */}
            <Collapsible className="w-full">
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 mb-8">
                  {/* Starter Plan */}
                  <Card className="relative overflow-hidden rounded-xl border-2 border-blue-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-blue-600 dark:bg-gray-900">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Starter</h3>
                      <div className="mt-4 flex items-baseline justify-center">
                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$5</span>
                        <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">550 credits monthly</p>
                    </div>
                    <ul className="mt-8 space-y-3 text-sm">
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        550 credits per month
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        ~350 hours of t3.micro
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Multiple cloud providers
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Email support
                      </li>
                    </ul>
                    <div className="mt-8">
                      <Link
                        href="/dashboard"
                        className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        Choose Starter
                      </Link>
                    </div>
                  </Card>

                  {/* Business Plan */}
                  <Card className="relative overflow-hidden rounded-xl border-2 border-orange-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-orange-600 dark:bg-gray-900">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Business</h3>
                      <div className="mt-4 flex items-baseline justify-center">
                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$25</span>
                        <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">3,200 credits monthly</p>
                    </div>
                    <ul className="mt-8 space-y-3 text-sm">
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        3,200 credits per month
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        ~40 hours of GPU instances
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Team collaboration
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        SLA guarantee
                      </li>
                    </ul>
                    <div className="mt-8">
                      <Link
                        href="/dashboard"
                        className="block w-full rounded-lg bg-orange-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
                      >
                        Choose Business
                      </Link>
                    </div>
                  </Card>

                  {/* Pay As You Go / Top-up Plan */}
                  <Card className="relative overflow-hidden rounded-xl border-2 border-indigo-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-indigo-600 dark:bg-gray-900">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pay As You Go</h3>
                      <div className="mt-4 flex items-baseline justify-center">
                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$0.01</span>
                        <span className="ml-1 text-xl font-medium text-gray-500">/credit</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Top up anytime</p>
                    </div>
                    <ul className="mt-8 space-y-3 text-sm">
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Buy credits as needed
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        No monthly commitment
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Credits never expire
                      </li>
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Perfect for occasional use
                      </li>
                    </ul>
                    <div className="mt-8">
                      <Link
                        href="/dashboard"
                        className="block w-full rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                      >
                        Buy Credits
                      </Link>
                    </div>
                  </Card>
                </div>
              </CollapsibleContent>
              
              <CollapsibleTrigger className="flex w-full items-center justify-center gap-2 py-4 text-blue-600 hover:text-blue-700 transition-colors">
                <span className="font-medium">View all plans</span>
                <ChevronDownIcon className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
              </CollapsibleTrigger>
            </Collapsible>
          </div>
          
          {/* VM Cost Reference */}
          <div className="mt-16 mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">VM Instance Costs</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Approximate runtime hours for popular instance types
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-800 font-semibold text-sm">
                <div>Instance Type</div>
                <div className="text-center">Free (150)</div>
                <div className="text-center">Starter (550)</div>
                <div className="text-center">Pro (1,200)</div>
                <div className="text-center">Business (3,200)</div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="grid grid-cols-5 gap-4 p-4 text-sm">
                  <div className="font-medium">cpx11 (0.75 credits/hr)</div>
                  <div className="text-center">200 hours</div>
                  <div className="text-center">733 hours</div>
                  <div className="text-center">1,600 hours</div>
                  <div className="text-center">4,267 hours</div>
                </div>
                <div className="grid grid-cols-5 gap-4 p-4 text-sm bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="font-medium">t3.micro (1.6 credits/hr)</div>
                  <div className="text-center">94 hours</div>
                  <div className="text-center">344 hours</div>
                  <div className="text-center">750 hours</div>
                  <div className="text-center">2,000 hours</div>
                </div>
                <div className="grid grid-cols-5 gap-4 p-4 text-sm">
                  <div className="font-medium">t3.medium (6.2 credits/hr)</div>
                  <div className="text-center">24 hours</div>
                  <div className="text-center">89 hours</div>
                  <div className="text-center">194 hours</div>
                  <div className="text-center">516 hours</div>
                </div>
                <div className="grid grid-cols-5 gap-4 p-4 text-sm bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="font-medium">g4dn.xlarge (78.9 credits/hr)</div>
                  <div className="text-center">1.9 hours</div>
                  <div className="text-center">7.0 hours</div>
                  <div className="text-center">15.2 hours</div>
                  <div className="text-center">40.6 hours</div>
                </div>
                <div className="grid grid-cols-5 gap-4 p-4 text-sm">
                  <div className="font-medium">p3.2xlarge (459 credits/hr)</div>
                  <div className="text-center">0.3 hours</div>
                  <div className="text-center">1.2 hours</div>
                  <div className="text-center">2.6 hours</div>
                  <div className="text-center">7.0 hours</div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              * Unused credits roll over monthly.
            </p>
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
                    Our pay-as-you-go pricing is based on the actual time your VMs run on our infrastructure.
                    You'll be charged credits per hour based on the instance type you choose - Basic, Standard, or
                    GPU VMs. This allows you to scale your usage up or down as needed without any fixed monthly
                    fees. You get 150 free credits per month plus a 100 credit welcome bonus.
                  </p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible className="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <h4 className="text-lg font-medium">Can I launch multiple VMs simultaneously?</h4>
                  <ChevronDownIcon className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Yes, you can launch multiple VMs simultaneously across different providers (AWS and Hetzner). 
                    Each VM will be charged independently based on its instance type and runtime. You can manage 
                    all your VMs from a single dashboard with SSH access details for each.
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
                    Currently we offer a generous free tier with 150 credits per month plus a 100 credit welcome bonus.
                    We're working on additional subscription plans and volume pricing for heavy users. Stay tuned for
                    enterprise plans with higher credit allocations and priority support.
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
                    Yes! New users get 100 welcome bonus credits plus 150 free credits every month. This gives you 
                    plenty of time to test our platform with real VMs. You can launch a t3.micro instance and run 
                    it for over 160 hours with just your welcome bonus - perfect for trying out the service.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </section>
      </main>
      <footer className="bg-gray-900 py-8 text-white grow">
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
