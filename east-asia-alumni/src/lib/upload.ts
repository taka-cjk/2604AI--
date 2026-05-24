import type { SupabaseClient } from "@supabase/supabase-js"

export async function uploadImage(
  supabase: SupabaseClient,
  bucket: string,
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
