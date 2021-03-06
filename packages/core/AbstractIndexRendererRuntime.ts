import {LazyGetter} from 'lazy-get-decorator';
import {compileTemplate, Options as PugOptions} from 'pug';
import {
  InputOptions,
  ModuleFormat,
  OutputBundle,
  OutputChunk,
  OutputOptions,
  OutputPlugin,
  Plugin,
  PluginContext
} from 'rollup';
import {IndexPugLocals} from './IndexPugLocals';
import {IndexRendererOptions, InlineCssFn} from './IndexRendererOptions';
import {filterCss} from './lib/filterCss';
import {filterEntryChunks} from './lib/filterEntryChunks';
import {PugLoader} from './lib/PugLoader';
import {stringifyLocals} from './lib/stringifyLocals';
import {TagDefinition} from './TagDefinition';

//tslint:disable:no-this-assignment

const _loader: unique symbol = Symbol('loader');
const _resolveEntrypoint: unique symbol = Symbol('resolveEntrypoint');

type Partials = 'entrypoint' | 'inlineCss';

type IAbstractIndexRendererRuntime = Partial<Pick<IndexRendererOptions, Partials>> &
  Required<Omit<IndexRendererOptions, Partials>>;

export abstract class AbstractIndexRendererRuntime implements IAbstractIndexRendererRuntime {
  public readonly base: string;

  public readonly dontLoadJs: RegExp[];

  public readonly emitBundleInfo: string;

  public readonly entrypoint?: string | number;

  public readonly inlineCss?: InlineCssFn;

  public readonly input: string;

  public readonly loaderOutputName: string;

  public readonly outputFileName: string;

  public readonly pugOptions: Omit<PugOptions, 'filename' | 'name'>;

  protected compileFn: compileTemplate;

  protected loaderId: string;

  private [_loader]: PugLoader;

  public constructor(options: IndexRendererOptions) {
    if (!options.input) {
      throw new Error(`Input absent`);
    }

    this.input = options.input;
    this.inlineCss = options.inlineCss;
    this.loaderOutputName = options.loaderOutputName || this.getDefaultLoaderOutputName();
    this.outputFileName = options.outputFileName!;
    this.pugOptions = options.pugOptions || {};
    this.dontLoadJs = options.dontLoadJs!;
    this.emitBundleInfo = options.emitBundleInfo!;
    this.entrypoint = options.entrypoint;

    if (options.base) {
      this.base = options.base.endsWith('/') ? options.base : `${options.base}/`;
    } else {
      this.base = '/';
    }
  }

  @LazyGetter()
  protected get outputFormatsSupported(): ModuleFormat[] {
    return this.getOutputFormatsSupported();
  }

  @LazyGetter()
  protected get resolvedLoader(): string | Buffer {
    return this.resolveLoader();
  }

  @LazyGetter()
  protected get shouldLoadChunk(): (chunk: OutputChunk) => boolean {
    const dontLoadJs = this.dontLoadJs;

    if (!Array.isArray(dontLoadJs) || !dontLoadJs.length) {
      return () => true;
    } else if (dontLoadJs.length === 1) {
      const reg = dontLoadJs[0];

      return chunk => !reg.test(chunk.fileName);
    } else {
      return chunk => !dontLoadJs.some(reg => reg.test(chunk.fileName));
    }
  }

  protected static scriptFromSrc(src: string): TagDefinition {
    return {
      attributes: {
        src,
        type: 'application/javascript'
      }
    };
  }

  public createOutputPlugin(): OutputPlugin {
    const self = this;

    return {
      generateBundle(this: PluginContext, opts, bundle, isWrite): void | Promise<void> {
        return self.generateBundle(this, opts, bundle, isWrite);
      },
      name: this.getOutputPluginName(),
      outputOptions(this: PluginContext, opts: OutputOptions): null {
        return self.outputOptions(this, opts);
      },
      renderStart(this: PluginContext): Promise<void> | void {
        return self.renderStart(this);
      }
    };
  }

  public createPlugin(): Plugin {
    const self = this;

    return {
      buildStart(this: PluginContext, inputOptions) {
        return self.buildStart(this, inputOptions);
      },
      name: 'index-renderer-core'
    };
  }

  protected buildStart(ctx: PluginContext, {input: pluginInput}: InputOptions): Promise<void> | void {
    let input: string;
    try {
      input = this[_resolveEntrypoint](pluginInput);
    } catch (e) {
      ctx.error(e.message);
    }

    if (!this[_loader] || this[_loader].input !== this.input) {
      this[_loader] = new PugLoader(this.pugOptions, this.input);
    }

    ctx.addWatchFile(input);
    if (!this.outputFileName) {
      return undefined;
    }

    return this[_loader].load()
      .then(({compileFn, deps}) => {
        this.compileFn = compileFn;
        for (const d of deps) {
          ctx.addWatchFile(d);
        }
      });
  }

  protected async generateBundle(
    ctx: PluginContext,
    _opts: OutputOptions,
    bundle: OutputBundle,
    _isWrite: boolean
  ): Promise<void> {
    const cssFiles: string[] = [];
    const jsFiles: TagDefinition[] = this.getInitialJsFiles(ctx, bundle);
    const locals: IndexPugLocals = {
      base: this.base,
      cssFiles,
      jsFiles
    };

    if (this.inlineCss) {
      locals.inlineCss = await this.inlineCss();
    }

    const bundleArray = Object.values(bundle);

    const jsFileNames = bundleArray
      .filter(filterEntryChunks)
      .filter(this.shouldLoadChunk)
      .map(this.mapBaseUrl, this);

    this.onJsFileNamesLoaded(ctx, jsFileNames, locals, bundle);
    cssFiles.push(...bundleArray.filter(filterCss).map(this.mapBaseUrl, this));

    if (this.emitBundleInfo) {
      ctx.emitFile({
        fileName: this.emitBundleInfo,
        source: stringifyLocals(locals),
        type: 'asset'
      });
    }

    if (this.outputFileName) {
      ctx.emitFile({
        fileName: this.outputFileName,
        source: this.compileFn(locals),
        type: 'asset'
      });
    }
  }

  protected abstract getDefaultLoaderOutputName(): string;

  protected getInitialJsFiles(_ctx: PluginContext, _bundle: OutputBundle): TagDefinition[] {
    return [];
  }

  protected abstract getOutputFormatsSupported(): ModuleFormat[];

  protected abstract getOutputPluginName(): string;

  protected mapBaseUrl(chunk: Pick<OutputChunk, 'fileName'>): string {
    return this.base + chunk.fileName;
  }

  protected onJsFileNamesLoaded(
    _ctx: PluginContext,
    _jsFileNames: string[],
    _locals: IndexPugLocals,
    _bundle: OutputBundle
  ): void {
    // noop in the abstract class
  }

  protected outputOptions(ctx: PluginContext, opts: OutputOptions): null {
    if (!opts.format || !this.outputFormatsSupported.includes(opts.format)) {
      ctx.error(`Output format not supported: ${opts.format}`);
    }

    return null;
  }

  protected renderStart(ctx: PluginContext): Promise<void> | void {
    this.loaderId = ctx.emitFile({
      name: this.loaderOutputName || this.getDefaultLoaderOutputName(),
      source: this.resolvedLoader,
      type: 'asset'
    });
  }

  protected abstract resolveLoader(): string | Buffer;

  private [_resolveEntrypoint](pluginInput: InputOptions['input']): string {
    if (!pluginInput) {
      throw new Error('Input absent');
    } else if (typeof pluginInput === 'string') {
      return pluginInput;
    } else if (this.entrypoint !== undefined) {
      return pluginInput[this.entrypoint];
    } else if (Array.isArray(pluginInput) && pluginInput.length === 1) {
      return pluginInput[0];
    } else {
      throw new Error('Must provide entrypoint option on non-string rollup input.');
    }
  }
}
