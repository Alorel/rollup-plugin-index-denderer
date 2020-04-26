import {AbstractIndexRendererRuntime, IndexPugLocals, TagDefinition} from '@alorel/rollup-plugin-index-renderer-core';
import {readFileSync} from 'fs';
import {ModuleFormat, OutputBundle, OutputChunk, PluginContext} from 'rollup';

function mapSystemImport(chunkName: string): string {
  return `System.import(${JSON.stringify(chunkName)})`;
}

export class SystemjsIndexRendererRuntime extends AbstractIndexRendererRuntime {
  /** @inheritDoc */
  protected getDefaultLoaderOutputName(): string {
    return 'system.js';
  }

  /** @inheritDoc */
  protected getInitialJsFiles(ctx: PluginContext, bundle: OutputBundle): TagDefinition[] {
    return [AbstractIndexRendererRuntime.scriptFromSrc(
      this.mapBaseUrl(bundle[ctx.getFileName(this.loaderId)] as OutputChunk)
    )];
  }

  /** @inheritDoc */
  protected getOutputFormatsSupported(): ModuleFormat[] {
    return Object.freeze(['system', 'systemjs']) as ModuleFormat[];
  }

  /** @inheritDoc */
  protected getOutputPluginName(): string {
    return 'index-renderer-systemjs';
  }

  /** @inheritDoc */
  protected onJsFileNamesLoaded(
    _ctx: PluginContext,
    jsFileNames: string[],
    locals: IndexPugLocals
  ): void {
    locals.jsFiles.push({
      attributes: {type: 'application/javascript'},
      body: jsFileNames.map(mapSystemImport).join(';') + ';'
    });
  }

  /** @inheritDoc */
  protected resolveLoader(): Buffer {
    return readFileSync(require.resolve('systemjs/dist/s'));
  }
}
