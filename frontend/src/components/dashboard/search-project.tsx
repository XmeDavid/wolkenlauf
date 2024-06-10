"use client";

import { useState } from "react";
import { Input } from "~/components/ui/input";


export interface SearchProjectProps {
  onSearch: (query: string) => void;
};

export default function SearchProject({ onSearch }: SearchProjectProps) {

  const [search, setSearch] = useState<string>("");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch(search);
    }
  };

  return (
    <div className="w-full flex-1">
      <Input
        className="w-full bg-white shadow-none appearance-none pl-4 md:w-2/3 lg:w-1/3 dark:bg-gray-950"
        placeholder="Search projects..."
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
