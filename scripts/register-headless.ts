import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installHeadlessBrowserEnv } from './headless-canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

installHeadlessBrowserEnv(REPO_ROOT);
