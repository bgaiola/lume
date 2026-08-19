-- Session expiry.
--
-- A PENDING session used to stay joinable forever: a code forwarded over
-- WhatsApp still opened the customer's machine months later, and scanning the
-- 5-character code space stayed profitable indefinitely. `expiresAt` closes
-- that window.
--
-- The column is NOT NULL, so existing rows are backfilled before the
-- constraint is enforced. Sessions already finished get their end time;
-- anything still open is treated as expired now, which is the safe default
-- (it can no longer be joined).

-- 1. Add nullable so the table can be rewritten without blocking on old rows.
ALTER TABLE "Session" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- 2. Backfill. Finished sessions keep their real end; open ones expire now.
UPDATE "Session"
SET "expiresAt" = COALESCE("endedAt", "startedAt" + INTERVAL '15 minutes', NOW())
WHERE "expiresAt" IS NULL;

-- 3. Enforce the constraint now that every row has a value.
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET NOT NULL;

-- 4. Index that drives the sweep closing sessions nobody ever joined.
CREATE INDEX "Session_status_expiresAt_idx" ON "Session"("status", "expiresAt");
