import {AbstractIndexRendererRuntime, IndexPugLocals} from '@alorel/rollup-plugin-index-renderer-core';
import {ModuleFormat, PluginContext} from 'rollup';

export class IifeIndexRendererRuntime extends AbstractIndexRendererRuntime {
  /** @inheritDoc */
  protected getDefaultLoaderOutputName(): string {
    return '';
  }

  /** @inheritDoc */
  protected getOutputFormatsSupported(): ModuleFormat[] {
    return Object.freeze(['iife']) as ModuleFormat[];
  }

  /** @inheritDoc */
  protected getOutputPluginName(): string {
    return 'index-renderer-iife';
  }

  /** @inheritDoc */
  protected renderStart(): Promise<void> | void {
    // do nothing, override abstract
  }

  /** @inheritDoc */
  protected onJsFileNamesLoaded(
    _ctx: PluginContext,
    jsFileNames: string[],
    locals: IndexPugLocals
  ): void {
    locals.jsFiles.push(...jsFileNames.map(AbstractIndexRendererRuntime.scriptFromSrc));
  }

  /** @inheritDoc */
  protected resolveLoader(): string | Buffer {
    return '';
  }
}
