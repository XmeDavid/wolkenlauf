import { Button } from "~/components/ui/button";

import { PlayIcon, SettingsIcon, SaveIcon } from "~/components/icons";

export default function Component() {
  return (
    <div className="flex items-center justify-between bg-zinc-100 px-4 py-2 shadow-sm dark:bg-gray-950">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="group">
          <PlayIcon className="h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-600 transition-all" />
          <span className="sr-only">Run</span>
        </Button>
        <Button variant="ghost" size="icon" className="group">
          <SaveIcon className="h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-600 transition-all" />
          <span className="sr-only">Save</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="group">
          <SettingsIcon className="h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-600 transition-all" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </div>
  )
}

/*

        <Separator orientation="vertical" className="h-6 bg-gray-700 dark:bg-gray-800" />
        <Button variant="ghost" size="icon">
          <GitBranchIcon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <span className="sr-only">Git</span>
        </Button>
        <Button variant="ghost" size="icon">
          <TerminalIcon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <span className="sr-only">Terminal</span>
        </Button>
        <Button variant="ghost" size="icon">
          <PlugIcon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <span className="sr-only">Extensions</span>
        </Button>
        <Button variant="ghost" size="icon">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <span className="sr-only">Search</span>
        </Button>
        <Button variant="ghost" size="icon">
          <MaximizeIcon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <span className="sr-only">Maximize</span>
        </Button>
*/