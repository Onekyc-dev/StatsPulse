"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SearchBox } from "./SearchBox";

export function MobileSearchButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.05] lg:hidden"
      >
        <Search size={19} />
      </button>
      {open && <SearchBoxOverlay onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchBoxOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}>
      <SearchBox variant="overlay" onCloseOverlay={onClose} />
    </div>
  );
}
