import {Options as PugOptions} from 'pug';

export interface IndexRendererOptions {
  /** Output assets' base URL. */
  base?: string;

  /** Set to a fileName to emit pug locals to that file */
  emitBundleInfo?: string;

  dontLoadJs?: RegExp[];

  /** Input pug file. Should be an absolute path. */
  input: string;

  /** Name of the loader chunk */
  loaderOutputName?: string;

  /** Omit to not emit a HTML file */
  outputFileName?: string;

  pugOptions?: Omit<PugOptions, 'filename' | 'name'>;
}
