DROP INDEX IF EXISTS "octo_supplier_connections_operator_id_idx";
ALTER TABLE "octo_supplier_connections" DROP COLUMN IF EXISTS "agreement_id";
ALTER TABLE "octo_supplier_connections" DROP COLUMN IF EXISTS "operator_id";

DROP TABLE IF EXISTS "octo_operator_agreements";

DROP INDEX IF EXISTS "octo_participants_operator_id_idx";
ALTER TABLE "octo_participants" DROP COLUMN IF EXISTS "inventory_evidence";
ALTER TABLE "octo_participants" DROP COLUMN IF EXISTS "operator_id";
