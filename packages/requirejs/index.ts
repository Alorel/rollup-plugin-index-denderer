import {AbstractIndexRendererRuntime, IndexPugLocals} from '@alorel/rollup-plugin-index-renderer-core';
import {readFileSync} from 'fs';
import {ModuleFormat, OutputBundle, OutputChunk, PluginContext} from 'rollup';

export class RequirejsIndexRendererRuntime extends AbstractIndexRendererRuntime {
  /** @inheritDoc */
  protected getDefaultLoaderOutputName(): string {
    return 'require.js';
  }

  /** @inheritDoc */
  protected getOutputFormatsSupported(): ModuleFormat[] {
    return Object.freeze(['amd']) as ModuleFormat[];
  }

  /** @inheritDoc */
  protected getOutputPluginName(): string {
    return 'index-renderer-requirejs';
  }

  /** @inheritDoc */
  protected onJsFileNamesLoaded(
    ctx: PluginContext,
    jsFileNames: string[],
    locals: IndexPugLocals,
    bundle: OutputBundle
  ): void {
    locals.jsFiles.push({
      attributes: {
        'data-main': jsFileNames[0],
        src: this.mapBaseUrl(bundle[ctx.getFileName(this.loaderId)] as OutputChunk),
        type: 'application/javascript'
      }
    });
  }

  /** @inheritDoc */
  protected resolveLoader(): Buffer {
    return readFileSync(require.resolve('requirejs/require.js'));
  }

}
