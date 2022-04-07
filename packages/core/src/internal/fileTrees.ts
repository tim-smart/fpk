import * as Fs from "fs";
import { Operation } from "fs-tree-diff";
import * as path from "path";
import * as CB from "strict-callbag-basics";

import FSTree = require("fs-tree-diff");

export function toFileTree(dir: string) {
  return (inputSource: CB.Source<string>) =>
    CB.pipe(
      inputSource,
      CB.map((file) => path.relative(dir, file)),
      CB.toArray,
      CB.map((files) => FSTree.fromPaths(files, { sortAndExpand: true })),
    );
}

export interface IInputContents
  extends Readonly<{
    [file: string]: Buffer | string;
  }> {}

export function calculatePatch(
  a: FSTree,
  b: FSTree,
  { contents, outDir }: { contents: IInputContents; outDir: string },
) {
  return b.calculatePatch(a, (a, b) => {
    if (a.isDirectory() || b.isDirectory()) {
      return a.isDirectory() && b.isDirectory();
    }

    const aContent =
      typeof contents[a.relativePath] === "string"
        ? Buffer.from(contents[a.relativePath])
        : (contents[a.relativePath] as Buffer);
    const bContent = Fs.readFileSync(path.join(outDir, b.relativePath));

    return aContent.compare(bContent) === 0;
  });
}

export type ExecutePatchError = {
  _tag: "fs";
  op: string;
  cause: unknown;
};

const runFs = (op: string, f: (cb: CB.Callback<void, unknown>) => void) =>
  CB.pipe(
    CB.fromCallback(f),
    CB.mapError(
      (cause): ExecutePatchError => ({
        _tag: "fs",
        op,
        cause,
      }),
    ),
  );

export function executePatch(contents: IInputContents, outDir: string) {
  return (source: CB.Source<Operation>) =>
    CB.pipe(
      source,
      CB.batchUntil(([op]) => op === "mkdir" || op === "rmdir", true),
      CB.chain((ops) =>
        CB.chainParP_(
          CB.fromIter(ops),
          ([op, file, _entry]): CB.Source<void, ExecutePatchError> => {
            const path = `${outDir}/${file}`;

            console.log(op.toUpperCase(), file);

            switch (op) {
              case "mkdir":
                return runFs(op, (cb) => Fs.mkdir(path, cb));
              case "rmdir":
                return runFs(op, (cb) => Fs.rmdir(path, cb));
              case "change":
              case "create":
                return runFs(op, (cb) =>
                  Fs.writeFile(path, contents[file], cb),
                );
              case "unlink":
                return runFs(op, (cb) => Fs.unlink(path, cb));
            }
          },
        ),
      ),
    );
}
