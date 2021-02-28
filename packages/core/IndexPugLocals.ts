import {TagDefinition} from './TagDefinition';

export interface IndexPugLocals {
  base: string;

  cssFiles: string[];

  inlineCss?: string;

  jsFiles: TagDefinition[];
}
