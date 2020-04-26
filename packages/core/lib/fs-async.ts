import * as fs from 'fs';
import {promisify} from 'util';

/** @internal */
export const readFile: (path: string, encoding: 'utf8') => Promise<string> = promisify(fs.readFile);
