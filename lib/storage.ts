import { createClient } from "@supabase/supabase-js";

const BUCKET = "recommendation-images";

// Secret key bypasses RLS — this client must only ever be used server-side.
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export async function uploadImage(
  bytes: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, bytes, { contentType });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return;

  const filename = imageUrl.slice(index + marker.length);
  await supabase.storage.from(BUCKET).remove([filename]);
}
