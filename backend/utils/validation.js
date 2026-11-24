import HttpError from './HttpError.js';

export function requireText(value, label, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new HttpError(400, `${label} is required and must be no longer than ${maxLength} characters.`);
  }
  return value.trim();
}

export function parseAssignment(body = {}, partial = false) {
  const values = {};
  for (const [field, maxLength] of [['title', 120], ['subject', 100], ['description', 2000]]) {
    if (!partial || Object.hasOwn(body, field)) values[field] = requireText(body[field], field, maxLength);
  }
  if (!partial || Object.hasOwn(body, 'deadline')) {
    const deadline = new Date(body.deadline);
    if (!body.deadline || Number.isNaN(deadline.getTime())) throw new HttpError(400, 'A valid deadline is required.');
    values.deadline = deadline;
  }
  if (!partial || Object.hasOwn(body, 'maxMarks')) {
    const maxMarks = Number(body.maxMarks ?? 50);
    if (!Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 1000) {
      throw new HttpError(400, 'maxMarks must be a whole number between 1 and 1000.');
    }
    values.maxMarks = maxMarks;
  }
  if (!Object.keys(values).length) throw new HttpError(400, 'Provide at least one assignment field to update.');
  return values;
}

export function validateObjectId(value) {
  if (!/^[a-f\d]{24}$/i.test(value)) throw new HttpError(400, 'Invalid resource ID.');
}
