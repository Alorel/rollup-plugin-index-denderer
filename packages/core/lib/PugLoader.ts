import {promises as fs} from 'fs';
import {compile, compileClientWithDependenciesTracked, compileTemplate, Options, Options as PugOptions} from 'pug';

interface Out {
  compileFn: compileTemplate;

  deps: string[];
}

interface TemplateRead {
  body: string;

  changed: boolean;
}

/** @internal */
export class PugLoader {
  private compileFn: compileTemplate;

  private deps: string[];

  private prevTemplate: string;

  public constructor(
    private readonly pugOptions: Options,
    public readonly input: string
  ) {
  }

  public load(): Promise<Out> {
    return this.readTemplate()
      .then(({body, changed}): Out => {
        if (changed) {
          const opts: PugOptions = Object.freeze({
            doctype: 'html',
            ...this.pugOptions,
            filename: this.input
          });
          this.deps = compileClientWithDependenciesTracked(body, opts).dependencies;
          this.compileFn = compile(body, opts);
        }

        return {deps: this.deps, compileFn: this.compileFn};
      });
  }

  private readTemplate(): Promise<TemplateRead> {
    return fs.readFile(this.input, 'utf8')
      .then(body => {
        const changed = body !== this.prevTemplate;
        this.prevTemplate = body;

        return {body, changed};
      });
  }
}
