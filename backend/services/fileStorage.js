import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import HttpError from '../utils/HttpError.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
export const uploadDirectory = path.resolve(currentDirectory, '..', 'uploads');
const allowedTypes = new Map([
  ['.pdf', ['application/pdf']],
  ['.doc', ['application/msword', 'application/octet-stream']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream']],
  ['.txt', ['text/plain']],
  ['.png', ['image/png']],
  ['.jpg', ['image/jpeg']],
  ['.jpeg', ['image/jpeg']],
]);

await mkdir(uploadDirectory, { recursive: true });

export const submissionUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const acceptedMimeTypes = allowedTypes.get(extension);
    if (!acceptedMimeTypes || !acceptedMimeTypes.includes(file.mimetype)) {
      callback(new HttpError(400, 'Upload a PDF, DOC, DOCX, TXT, JPG, JPEG, or PNG file.'));
      return;
    }
    callback(null, true);
  },
});

export async function removeStoredFile(fileName) {
  if (!fileName || path.basename(fileName) !== fileName) return;
  try {
    await unlink(path.join(uploadDirectory, fileName));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
