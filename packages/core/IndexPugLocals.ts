import {TagDefinition} from './TagDefinition';

export interface IndexPugLocals {
  base: string;

  cssFiles: string[];

  jsFiles: TagDefinition[];
}
