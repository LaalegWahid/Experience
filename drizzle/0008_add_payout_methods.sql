CREATE TYPE "public"."payout_chain" AS ENUM('ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'tron', 'solana');--> statement-breakpoint
CREATE TYPE "public"."payout_method_type" AS ENUM('bank', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."stablecoin" AS ENUM('USDC', 'USDT');--> statement-breakpoint
CREATE TABLE "payout_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"type" "payout_method_type" NOT NULL,
	"account_holder_name" text,
	"iban" text,
	"bic" text,
	"bank_name" text,
	"country" text,
	"wallet_address" text,
	"chain" "payout_chain",
	"stablecoin" "stablecoin",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_methods_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
ALTER TABLE "payout_methods" ADD CONSTRAINT "payout_methods_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;