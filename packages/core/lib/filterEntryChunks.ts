import {OutputAsset, OutputChunk} from 'rollup';

/** @internal */
type OutputEntryChunk = Omit<OutputChunk, 'isEntry'> & { isEntry: true };

/** @internal */
export function filterEntryChunks(c: OutputAsset | OutputChunk): c is OutputEntryChunk {
  return c.type === 'chunk' && c.isEntry;
}
