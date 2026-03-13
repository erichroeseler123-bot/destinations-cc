"use client";

import { useState } from "react";
import Next48Drawer from "@/app/components/dcc/next48/Next48Drawer";
import type { Next48EntityType } from "@/lib/dcc/next48/types";

type Props = {
  entityType: Next48EntityType;
  slug: string;
};

export default function Next48Button({ entityType, slug }: Props) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSession((value) => value + 1);
          setOpen(true);
        }}
        className="fixed bottom-4 right-4 z-40 rounded-full border border-cyan-300/40 bg-zinc-900/95 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-[0_10px_30px_rgba(0,0,0,0.45)] md:bottom-6 md:right-6"
      >
        Next 48 Hours
      </button>
      <Next48Drawer
        key={`${entityType}:${slug}:${session}`}
        open={open}
        onClose={() => setOpen(false)}
        entityType={entityType}
        slug={slug}
      />
    </>
  );
}
