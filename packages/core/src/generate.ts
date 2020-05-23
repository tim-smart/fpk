import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import * as fs from "fs/promises";
import * as path from "path";
import * as R from "ramda";
import FSTree from "fs-tree-diff";
import yaml from "js-yaml";

export function files$(dir: string): Rx.Observable<string> {
  return Rx.from(fs.readdir(dir)).pipe(
    RxOp.flatMap((f) => f),
    RxOp.filter((f) => !f.startsWith(".")),
    RxOp.flatMap((file) =>
      Rx.from(fs.stat(`${dir}/${file}`)).pipe(
        RxOp.map((sf) => ({ file, isDir: sf.isDirectory() })),
      ),
    ),
    RxOp.flatMap((f) =>
      f.isDir ? files$(`${dir}/${f.file}`) : Rx.of(`${dir}/${f.file}`),
    ),
  );
}

export function resolveFile(file: string) {
  return require(path.resolve(file));
}

export interface IConfig
  extends Readonly<{
    file: string;
    contents: any;
  }> {}

export type TFormat = "json" | "yaml";

export const encodeContents = R.curryN(2, (format: TFormat, contents: any) => {
  if (format === "json") {
    return JSON.stringify(contents, null, 2);
  }

  return yaml.safeDump(contents, { skipInvalid: true });
});

export function configs$(
  dir: string,
  format: TFormat = "yaml",
): Rx.Observable<IConfig> {
  return files$(dir).pipe(
    RxOp.map((file) => ({
      file,
      exports: resolveFile(file),
    })),
    RxOp.filter(R.hasPath(["exports", "default"])),
    RxOp.map(({ file, exports }) => ({
      basename: R.pipe(
        R.split("."),
        R.remove(-1, 1),
        R.join("."),
      )(path.relative(dir, file)),
      contents: exports.default,
    })),
    RxOp.flatMap(({ basename, contents }) =>
      Rx.from(Object.keys(contents)).pipe(
        RxOp.map((file) => ({
          file: `${basename}/${file}.${format}`,
          contents: encodeContents(format, contents[file]),
        })),
      ),
    ),
  );
}

export function toFileTree() {
  return (input$: Rx.Observable<IConfig>) =>
    input$.pipe(
      RxOp.toArray(),
      RxOp.map((configs) => FSTree.fromPaths(R.map((c) => c.file, configs))),
    );
}
