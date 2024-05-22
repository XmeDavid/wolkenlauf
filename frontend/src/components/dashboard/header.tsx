import Link from "next/link"
import { CodeIcon } from "~/components/icons";


export default function DashboardHeader() {
  return (
    <div className="flex justify-between min-h-16 max-h-16 items-center border-b px-6">
      <Link className="flex items-center gap-2 font-semibold" href="/">
        <CodeIcon className="h-8 w-8" />
        <span className="text-xl">Wolkenlauf</span>
      </Link>
    </div>
  );
}
