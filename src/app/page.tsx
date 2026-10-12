"use client";

import { useEffect, useState, useMemo } from "react";

// ─── Configuration ────────────────────────────────────────────────

const LAST_DAY = new Date("2027-03-20T00:00:00+08:00");

interface Holiday {
  date: Date;
  name: string;
  short: string;
}

const HOLIDAYS: Holiday[] = [
  { date: new Date("2026-11-01T00:00:00+08:00"), name: "All Saints' Day", short: "All Saints" },
  { date: new Date("2026-11-02T00:00:00+08:00"), name: "All Souls' Day", short: "All Souls" },
  { date: new Date("2026-11-16T00:00:00+08:00"), name: "ASEAN Summit", short: "ASEAN Summit" },
  { date: new Date("2026-11-17T00:00:00+08:00"), name: "ASEAN Summit", short: "ASEAN Summit" },
  { date: new Date("2026-11-18T00:00:00+08:00"), name: "ASEAN Summit", short: "ASEAN Summit" },
  { date: new Date("2026-11-30T00:00:00+08:00"), name: "Bonifacio Day", short: "Bonifacio Day" },
  { date: new Date("2026-12-08T00:00:00+08:00"), name: "Immaculate Conception", short: "Immaculate Conception" },
  { date: new Date("2026-12-25T00:00:00+08:00"), name: "Christmas Day", short: "Christmas" },
  { date: new Date("2026-12-30T00:00:00+08:00"), name: "Rizal Day", short: "Rizal Day" },
  { date: new Date("2027-01-01T00:00:00+08:00"), name: "New Year's Day", short: "New Year" },
  { date: new Date("2027-02-12T00:00:00+08:00"), name: "Chinese New Year", short: "CNY" },
];

// ─── Helpers ───────────────────────────────────────────────────────

function getPayrollDates(): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  // Start from current month and go through March 2027
  while (
    year < 2027 ||
    (year === 2027 && month <= 2) // March = 2
  ) {
    for (const day of [14, 29]) {
      dates.push(new Date(year, month, day, 0, 0, 0, 0));
    }
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return dates;
}

function countWeekdaysExcludingHolidays(
  from: Date,
  to: Date,
  holidays: Holiday[]
): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);

  while (d <= to) {
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    const dateStr = d.toISOString().slice(0, 10);
    const isHoliday = holidays.some(
      (h) => h.date.toISOString().slice(0, 10) === dateStr
    );
    if (!isWeekend && !isHoliday) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function getNextPayroll(from: Date): Date {
  const payrolls = getPayrollDates();
  for (const p of payrolls) {
    if (p >= from) return p;
  }
  return payrolls[payrolls.length - 1];
}

function countRemainingPayrolls(from: Date, to: Date): number {
  const payrolls = getPayrollDates();
  return payrolls.filter((p) => p >= from && p <= to).length;
}

function msToCountdown(target: Date, now: number) {
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done: false,
  };
}

// ─── Components ────────────────────────────────────────────────────

function CountdownNumber({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[clamp(2.5rem,8vw,6rem)] font-bold tabular-nums tracking-tight leading-none glow">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">
        {label}
      </div>
    </div>
  );
}

function Separator() {
  return (
    <div className="text-[clamp(2rem,6vw,4rem)] font-bold text-zinc-700 leading-none select-none pb-6">
      :
    </div>
  );
}

export default function Home() {
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const mainCountdown = useMemo(
    () => (now ? msToCountdown(LAST_DAY, now) : null),
    [now]
  );

  const upcomingHolidays = useMemo(() => {
    if (!now) return [];
    return HOLIDAYS.filter((h) => h.date.getTime() > now).map((h) => ({
      ...h,
      countdown: msToCountdown(h.date, now),
    }));
  }, [now]);

  const nextPayroll = useMemo(
    () => (now ? getNextPayroll(new Date(now)) : null),
    [now]
  );
  const remainingPayrolls = useMemo(
    () => (now ? countRemainingPayrolls(new Date(now), LAST_DAY) : 0),
    [now]
  );
  const payrollCountdown = useMemo(
    () => (now && nextPayroll ? msToCountdown(nextPayroll, now) : null),
    [now, nextPayroll]
  );

  const weekdaysLeft = useMemo(() => {
    if (!now) return 0;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const end = new Date(LAST_DAY);
    end.setHours(0, 0, 0, 0);
    return countWeekdaysExcludingHolidays(today, end, HOLIDAYS);
  }, [now]);

  const upcomingHolidaysThisYear = upcomingHolidays.slice(0, 4);

  if (!mainCountdown || !payrollCountdown || !nextPayroll) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-black bg-radial min-h-screen">
        <div className="text-zinc-500 text-sm animate-pulse-soft">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-black bg-radial min-h-screen px-4 py-12">
      {/* Main countdown */}
      <div className="flex flex-col items-center mb-16">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-6">
          Final day of employment
        </p>
        <h1 className="text-sm font-medium text-zinc-400 mb-8 tracking-wide">
          March 20, 2027
        </h1>
        <div className="flex items-start gap-4 sm:gap-8">
          <CountdownNumber value={mainCountdown.days} label="Days" />
          <Separator />
          <CountdownNumber value={mainCountdown.hours} label="Hours" />
          <Separator />
          <CountdownNumber value={mainCountdown.minutes} label="Minutes" />
          <Separator />
          <div className="flex flex-col items-center">
            <div className="text-[clamp(2.5rem,8vw,6rem)] font-bold tabular-nums tracking-tight leading-none glow animate-pulse-soft">
              {String(mainCountdown.seconds).padStart(2, "0")}
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">
              Seconds
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 mb-16 w-full max-w-3xl">
        {/* Weekdays left */}
        <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20">
          <div className="text-4xl font-bold tabular-nums text-zinc-100 glow-sm">
            {weekdaysLeft}
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">
            Workdays left
          </div>
        </div>

        {/* Next payroll */}
        <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20">
          <div className="text-4xl font-bold tabular-nums text-zinc-100 glow-sm">
            {String(payrollCountdown.days).padStart(2, "0")}
            <span className="text-lg text-zinc-500 ml-1">days</span>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">
            Until next payroll
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            {nextPayroll.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Remaining payrolls */}
        <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20">
          <div className="text-4xl font-bold tabular-nums text-zinc-100 glow-sm">
            {remainingPayrolls}
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">
            Paychecks remaining
          </div>
        </div>
      </div>

      {/* Upcoming holidays */}
      {upcomingHolidaysThisYear.length > 0 && (
        <div className="w-full max-w-3xl">
          <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-6 text-center">
            Upcoming holidays
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingHolidaysThisYear.map((h) => (
              <div
                key={h.name + h.date.toISOString()}
                className="flex items-center justify-between p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    {h.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {h.date.toLocaleDateString("en-PH", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tabular-nums text-zinc-300 glow-sm">
                    {String(h.countdown.days).padStart(2, "0")}
                    <span className="text-xs text-zinc-500 ml-1">days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-xs text-zinc-700 tracking-wide">
        {new Date(now).toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  );
}
