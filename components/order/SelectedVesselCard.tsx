"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SsVessel } from "@/lib/order/types";
import { formatCents } from "@/lib/order/types";

type SelectedVesselCardProps = {
  vessel: SsVessel;
  expiresAt: string | null;
  oneOfAKind: boolean;
  onChange: () => void;
  onExpired: () => void;
};

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SelectedVesselCard({
  vessel,
  expiresAt,
  oneOfAKind,
  onChange,
  onExpired,
}: SelectedVesselCardProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0,
  );
  const onExpiredRef = useRef(onExpired);
  const notifiedRef = useRef(false);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    if (!expiresAt) return;
    notifiedRef.current = false;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(ms);
      if (ms <= 0 && !notifiedRef.current) {
        notifiedRef.current = true;
        onExpiredRef.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const expired = Boolean(expiresAt) && remainingMs <= 0;
  const priceLabel =
    vessel.priceAdjustmentCents === 0
      ? "Included"
      : `+${formatCents(vessel.priceAdjustmentCents)}`;

  return (
    <div className="border border-parchment bg-cream p-3">
      <div className="flex gap-3">
        <div className="image-frame relative h-20 w-16 shrink-0">
          {vessel.imageUrl ? (
            <Image
              src={vessel.imageUrl}
              alt={vessel.imageAlt || vessel.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-wide text-stone">Your vessel</p>
              <p className="font-medium text-bark">{vessel.name}</p>
              <p className="mt-0.5 text-sm text-stone">{priceLabel}</p>
            </div>
            <button
              type="button"
              className="shrink-0 text-sm text-salmon-dark underline underline-offset-2 transition-colors hover:text-salmon"
              onClick={onChange}
            >
              Change
            </button>
          </div>
          {expiresAt ? (
            <p
              className={`mt-2 text-xs ${expired ? "text-bark" : "text-stone"}`}
              role="status"
              aria-live="polite"
            >
              {expired ? (
                "Hold expired — please choose again."
              ) : (
                <>
                  {oneOfAKind
                    ? "One of a kind — held for you "
                    : "Held for you "}
                  <span className="font-medium tabular-nums text-bark">
                    {formatRemaining(remainingMs)}
                  </span>
                </>
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
