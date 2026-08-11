CREATE TYPE "public"."referral_earning_status" AS ENUM('pending', 'owed', 'paid', 'reversed');--> statement-breakpoint
CREATE TABLE "referral_earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_id" uuid,
	"referrer_user_id" text NOT NULL,
	"booking_id" uuid,
	"offering_id" uuid,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"status" "referral_earning_status" DEFAULT 'pending' NOT NULL,
	"reference" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrer_payout_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
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
	CONSTRAINT "referrer_payout_methods_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "service_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" text NOT NULL,
	"offering_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_referrals_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DROP INDEX "guest_referrals_referrer_idx";--> statement-breakpoint
DROP INDEX "host_referrals_referrer_idx";--> statement-breakpoint
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_referral_id_service_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."service_referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_referrer_user_id_user_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrer_payout_methods" ADD CONSTRAINT "referrer_payout_methods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_referrals" ADD CONSTRAINT "service_referrals_referrer_user_id_user_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_referrals" ADD CONSTRAINT "service_referrals_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_referrals" ADD CONSTRAINT "service_referrals_redeemed_by_user_id_user_id_fk" FOREIGN KEY ("redeemed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "referral_earnings_referrer_idx" ON "referral_earnings" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "referral_earnings_reference_idx" ON "referral_earnings" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "service_referrals_referrer_idx" ON "service_referrals" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "service_referrals_offering_idx" ON "service_referrals" USING btree ("offering_id");