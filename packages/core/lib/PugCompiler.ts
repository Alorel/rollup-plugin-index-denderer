import {compile, compileTemplate, Options} from 'pug';
import {readFile} from './fs-async';

/** @internal */
export class PugCompiler {
  public needsRecompile = true;

  private compileFn: compileTemplate;

  public constructor(private readonly input: string, private readonly opts: Options) {
  }

  public getCompileFn(): Promise<compileTemplate> {
    if (!this.needsRecompile) {
      return Promise.resolve(this.compileFn);
    }

    return readFile(this.input, 'utf8')
      .then(contents => {
        this.needsRecompile = false;
        this.compileFn = compile(contents, {
          doctype: 'html',
          ...this.opts,
          filename: this.input
        });

        return this.compileFn;
      });
  }
}
