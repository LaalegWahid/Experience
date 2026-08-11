"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./language-provider";

/**
 * A live "time left until the appointment" clock. Renders nothing until mounted
 * (so SSR and the first client render match — no hydration mismatch), then
 * ticks every second.
 */
export function Countdown({ target }: { target: string }) {
  const { t } = useLanguage();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) {
    return <span className="font-mono text-sm text-zinc-400">…</span>;
  }

  const diff = new Date(target).getTime() - now;
  if (diff <= 0) {
    return (
      <span className="font-mono text-sm font-medium text-accent">
        {t("cd.startingNow")}
      </span>
    );
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const parts = days > 0 ? [`${days}d`] : [];
  if (days > 0 || hours > 0) parts.push(`${pad(hours)}h`);
  parts.push(`${pad(minutes)}m`, `${pad(seconds)}s`);

  return (
    <span className="font-mono text-sm font-medium tabular-nums text-accent">
      {t("cd.timeLeft").replace("{time}", parts.join(" "))}
    </span>
  );
}
