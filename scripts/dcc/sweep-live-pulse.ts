import { sweepExpiredSignals } from "@/lib/dcc/livePulse/store";

const result = sweepExpiredSignals(new Date());
console.log(JSON.stringify({ ok: true, ...result }, null, 2));
