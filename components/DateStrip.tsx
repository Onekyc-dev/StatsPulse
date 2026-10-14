
"use client";

import { useRef, useState } from "react";

type CalendarDay = {
  date: Date;
  key: string;
  weekday: string;
  dayNumber: number;
  month: string;
};

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildCalendarDays(): CalendarDay[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const days: CalendarDay[] = [];

  // Show three days before today and ten days after today.
  for (let offset = -3; offset <= 10; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    days.push({
      date,
      key: getDateKey(date),
      weekday: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }).format(date),
      dayNumber: date.getDate(),
      month: new Intl.DateTimeFormat("en-US", {
        month: "short",
      }).format(date),
    });
  }

  return days;
}

export function DateStrip() {
  const days = useRef(buildCalendarDays()).current;
  const todayKey = getDateKey(new Date());

  const [selectedDate, setSelectedDate] = useState(todayKey);

  const selectedDay = days.find(
    (day) => day.key === selectedDate
  );

  return (
    <section
      aria-label="Select match date"
      className="w-full min-w-0"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            Matches
          </h2>

          <p className="mt-0.5 text-xs text-white/50">
            {selectedDay
              ? `${selectedDay.weekday}, ${selectedDay.month} ${selectedDay.dayNumber}`
              : "Select a date"}
          </p>
        </div>

        <span className="text-xs font-semibold text-pulse-500">
          SELECT DATE
        </span>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {days.map((day) => {
          const isSelected = day.key === selectedDate;
          const isToday = day.key === todayKey;

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDate(day.key)}
              aria-pressed={isSelected}
              aria-label={`${day.weekday}, ${day.month} ${day.dayNumber}${
                isToday ? ", today" : ""
              }`}
              className={[
                "flex min-w-[58px] shrink-0 flex-col",
                "items-center justify-center rounded-xl",
                "border px-2 py-3 transition-colors",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-pulse-500",
                isSelected
                  ? "border-pulse-500 bg-pulse-500 text-black"
                  : "border-white/10 bg-white/[0.04] text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "text-[11px] font-semibold uppercase",
                  isSelected ? "text-black/70" : "text-white/50",
                ].join(" ")}
              >
                {isToday ? "Today" : day.weekday}
              </span>

              <span className="mt-1 text-xl font-extrabold leading-none">
                {day.dayNumber}
              </span>

              <span
                className={[
                  "mt-1 text-[10px]",
                  isSelected ? "text-black/70" : "text-white/45",
                ].join(" ")}
              >
                {day.month}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default DateStrip;
