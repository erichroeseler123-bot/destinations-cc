import { getViatorClient } from "@/lib/viator/client";
import {
  extractViatorAcknowledgements,
  extractViatorNextCursor,
  extractViatorSupplierEvents,
  readViatorSupplierState,
  writeViatorSupplierArtifact,
  writeViatorSupplierState,
} from "@/lib/viator/supplier-events";

async function main() {
  const state = readViatorSupplierState();
  const response = await getViatorClient().getBookingsModifiedSince({ cursor: state.cursor || undefined });
  const events = extractViatorSupplierEvents(response);
  const acknowledgements = extractViatorAcknowledgements(response);
  const nextCursor = extractViatorNextCursor(response);
  const filePath = writeViatorSupplierArtifact({
    kind: "feed",
    cursor: state.cursor,
    payload: { cursor: state.cursor },
    response,
  });
  if (nextCursor) writeViatorSupplierState(nextCursor);

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        cursor: state.cursor,
        nextCursor,
        eventCount: events.length,
        acknowledgementCount: acknowledgements.length,
        filePath,
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
