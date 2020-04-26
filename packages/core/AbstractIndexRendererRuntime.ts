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
import {IndexRendererOptions} from './IndexRendererOptions';
import {filterCss} from './lib/filterCss';
import {filterEntryChunks} from './lib/filterEntryChunks';
import {PugCompiler} from './lib/PugCompiler';
import {stringifyLocals} from './lib/stringifyLocals';
import {TagDefinition} from './TagDefinition';

//tslint:disable:no-this-assignment

export abstract class AbstractIndexRendererRuntime implements Required<IndexRendererOptions> {
  public readonly base: string;

  public readonly dontLoadJs: RegExp[];

  public readonly emitBundleInfo: string;

  public readonly input: string;

  public readonly loaderOutputName: string;

  public readonly outputFileName: string;

  public readonly pugOptions: Omit<PugOptions, 'filename' | 'name'>;

  protected inputChunk: string;

  protected loaderId: string;

  protected templateAssetId: string;

  private compileFn: compileTemplate;

  private compiler: PugCompiler;

  public constructor(options: IndexRendererOptions) {
    if (!options.input) {
      throw new Error(`Input absent`);
    }

    this.input = options.input;
    this.loaderOutputName = options.loaderOutputName || this.getDefaultLoaderOutputName();
    this.outputFileName = options.outputFileName!;
    this.pugOptions = options.pugOptions || {};
    this.dontLoadJs = options.dontLoadJs!;
    this.emitBundleInfo = options.emitBundleInfo!;

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
      name: 'index-renderer-core',
      watchChange(id): void {
        self.watchChange(id);
      }
    };
  }

  protected buildStart(ctx: PluginContext, {input}: InputOptions): void | Promise<void> {
    if (typeof input !== 'string') {
      ctx.error('rollup options\' input must be a string');

      return; //tslint:disable-line:return-undefined
    }

    this.inputChunk = input;
    this.compiler = new PugCompiler(this.input, this.pugOptions);
    ctx.addWatchFile(this.input);

    return this.compiler.getCompileFn()
      .then(fn => {
        this.compileFn = fn;
      });
  }

  protected generateBundle(
    ctx: PluginContext,
    _opts: OutputOptions,
    bundle: OutputBundle,
    _isWrite: boolean
  ): void | Promise<void> {
    const cssFiles: string[] = [];
    const jsFiles: TagDefinition[] = this.getInitialJsFiles(ctx, bundle);
    const locals: IndexPugLocals = {
      base: this.base,
      cssFiles,
      jsFiles
    };

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

  protected watchChange(id: string): void {
    if (id === this.input && this.compiler) {
      this.compiler.needsRecompile = true;
    }
  }
}
