CREATE TABLE "host_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_provider_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "host_referrals_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "host_referrals" ADD CONSTRAINT "host_referrals_referrer_provider_id_providers_id_fk" FOREIGN KEY ("referrer_provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_referrals" ADD CONSTRAINT "host_referrals_redeemed_by_user_id_user_id_fk" FOREIGN KEY ("redeemed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "host_referrals_referrer_idx" ON "host_referrals" USING btree ("referrer_provider_id");