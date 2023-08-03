import { resolve } from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

export function resolveRoot(...paths) {
  return resolve(__dirname, '..', ...paths);
}
