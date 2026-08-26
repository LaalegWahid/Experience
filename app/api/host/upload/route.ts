import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/host";
import { isStorageConfigured, uploadImage } from "@/lib/storage";
import { tryCatch } from "@/shared/utils/TryCatch";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// POST multipart `file` — uploads an image and returns its public URL.
// Host/admin only.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "host" && user.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Image storage isn't configured yet." },
      { status: 503 },
    );
  }

  const formResult = await tryCatch(request.formData());
  if (!formResult.ok) {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = formResult.data.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller." },
      { status: 400 },
    );
  }

  const result = await tryCatch(uploadImage(file, `offerings/${user.id}`));
  if (!result.ok) {
    console.error("[upload] failed:", result.error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ url: result.data });
}
