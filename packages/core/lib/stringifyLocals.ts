/** @internal */
export const stringifyLocals: (obj: any) => string =
  process.env.NODE_ENV === 'production' ?
    obj => JSON.stringify(obj) + '\n' :
    obj => JSON.stringify(obj, null, 2) + '\n'; //tslint:disable-line:no-magic-numbers
