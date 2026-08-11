import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/shared/utils/env";

const BUCKET = "offering-images";

let client: SupabaseClient | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

function admin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Image storage is not configured.");
  }
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

let bucketReady = false;
async function ensureBucket(sb: SupabaseClient) {
  if (bucketReady) return;
  const { data } = await sb.storage.getBucket(BUCKET);
  if (!data) {
    // Ignore "already exists" races; only the missing-bucket case matters.
    await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "5MB",
    });
  }
  bucketReady = true;
}

/** Upload an image to the public bucket and return its public URL. */
export async function uploadImage(
  file: File,
  prefix: string,
): Promise<string> {
  const sb = admin();
  await ensureBucket(sb);

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) throw error;

  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
