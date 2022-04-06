import * as FS from "fs";
import * as CB from "strict-callbag-basics";

const glob = require("glob-to-regexp");

export type FilesError = { _tag: "readdir"; cause: unknown };

export function filesSource(
  dir: string,
  ignore?: string,
): CB.Source<string, FilesError> {
  const ignoreRegExp = ignore ? glob(ignore) : undefined;

  return CB.pipe(
    CB.fromCallback<FS.Dirent[], unknown>((cb) =>
      FS.readdir(dir, { withFileTypes: true }, cb),
    ),
    CB.mapError((cause): FilesError => ({ _tag: "readdir", cause })),

    CB.chain((f) => CB.fromIter(f)),
    CB.filter((f) => !f.name.startsWith(".")),
    CB.filter((f) => (ignoreRegExp ? !ignoreRegExp.test(f.name) : true)),
    CB.chainPar((f) =>
      f.isDirectory()
        ? filesSource(`${dir}/${f.name}`, ignore)
        : CB.of(`${dir}/${f.name}`),
    ),
  );
}
