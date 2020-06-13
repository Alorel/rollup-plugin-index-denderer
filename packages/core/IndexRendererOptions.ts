import {Options as PugOptions} from 'pug';

export interface IndexRendererOptions {
  /** Output assets' base URL. */
  base?: string;

  dontLoadJs?: RegExp[];

  /** Set to a fileName to emit pug locals to that file */
  emitBundleInfo?: string;

  /**
   * Required when rollup's input is not a string.
   *
   * If it's an array, this should be the index of the file we're rendering for.
   * If it's an object, this should be the key we're renreding for.
   */
  entrypoint?: string | number;

  /** Input pug file. Should be an absolute path. */
  input: string;

  /** Name of the loader chunk */
  loaderOutputName?: string;

  /** Omit to not emit a HTML file */
  outputFileName?: string;

  pugOptions?: Omit<PugOptions, 'filename' | 'name'>;
}
