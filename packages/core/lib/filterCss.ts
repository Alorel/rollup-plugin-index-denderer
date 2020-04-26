import {OutputAsset, OutputChunk} from 'rollup';

const reg = /\.css$/;

/** @internal */
export function filterCss(c: OutputAsset | OutputChunk): c is OutputAsset {
  return c.type === 'asset' && reg.test(c.fileName);
}
