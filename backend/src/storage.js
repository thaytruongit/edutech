// Lưu trữ tệp: Google Cloud Storage nếu có GCS_BUCKET, ngược lại giữ trên đĩa cục bộ.
// Cấu hình: GCS_BUCKET=ten-bucket, GOOGLE_APPLICATION_CREDENTIALS=duong-dan/service-account.json
import fs from 'node:fs';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';

const BUCKET = process.env.GCS_BUCKET || '';
const bucket = BUCKET ? new Storage().bucket(BUCKET) : null;

export const mode = bucket ? 'gcs' : 'local';

// Lưu tệp từ đường dẫn tạm; trả về { storage, object? , url? }
export async function save(localPath, filename, contentType) {
  if (!bucket) return { storage: 'local', url: `/files/${filename}` };
  const object = `uploads/${filename}`;
  await bucket.upload(localPath, { destination: object, metadata: { contentType } });
  return { storage: 'gcs', object };
}

// URL đọc tạm thời (bucket private) cho tệp GCS; tệp local trả URL cố định
export async function resolveUrl(entry) {
  if (entry.storage !== 'gcs' || !bucket) return entry.url;
  const [url] = await bucket.file(entry.object).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000
  });
  return url;
}

export async function remove(entry, uploadDir) {
  if (entry.storage === 'gcs' && bucket) {
    await bucket.file(entry.object).delete({ ignoreNotFound: true }).catch(() => {});
  } else if (entry.url) {
    fs.unlink(path.join(uploadDir, path.basename(entry.url)), () => {});
  }
}
