-- Migration: 0004_dcc_licenses.sql
-- Description: Create persistent dcc_licenses table for multi-instance serverless license storage and metering

CREATE TABLE IF NOT EXISTS "dcc_licenses" (
    "key" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "plan" text NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "authorized_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "max_monthly_requests" integer DEFAULT 25000 NOT NULL,
    "current_period_requests" integer DEFAULT 0 NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_licenses_email_idx" ON "dcc_licenses" ("email");
CREATE INDEX IF NOT EXISTS "dcc_licenses_stripe_sub_idx" ON "dcc_licenses" ("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "dcc_licenses_stripe_cust_idx" ON "dcc_licenses" ("stripe_customer_id");
