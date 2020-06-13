import {promises as fs} from 'fs';
import {compile, compileTemplate, Options} from 'pug';

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

    return fs.readFile(this.input, 'utf8')
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
