"use client";

import { useState } from "react";
import type { Match } from "@/lib/types";
import type { League } from "@/lib/leagues";
import { HomeMatchBrowser } from "@/components/HomeMatchBrowser";
import { LeaguesHub } from "@/components/LeaguesHub";

type CountryMatch = Match & {
country: string;
};

type HomeContentProps = {
matches: CountryMatch[];
leagues: League[];
};

export function HomeContent({
matches,
leagues,
}: HomeContentProps) {
const [selectedDate, setSelectedDate] = useState(() => {
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;

});

return (
<>
<HomeMatchBrowser
matches={matches}
selectedDate={selectedDate}
onDateChange={setSelectedDate}
/>

  {leagues.length > 0 && (
    <LeaguesHub
      leagues={leagues}
      selectedDate={selectedDate}
    />
  )}
</>

);
}
