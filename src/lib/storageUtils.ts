import { supabase } from './supabase';

export const uploadProfileImage = async (
  file: File,
  bucketName: string,
  userId: string,
  prefix: string,
  oldUrl?: string
): Promise<string> => {
  if (oldUrl && oldUrl.includes(userId)) {
    try {
      const urlObj = new URL(oldUrl);
      const pathParts = urlObj.pathname.split(`/${bucketName}/`);
      if (pathParts.length > 1) {
        await supabase.storage.from(bucketName).remove([pathParts[1]]);
      }
    } catch (e) {
      console.warn('Failed to clean up old image:', e);
    }
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${prefix}-${userId}-${Math.random()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
};
