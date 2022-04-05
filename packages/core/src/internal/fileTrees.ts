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

export function executePatch(contents: IInputContents, outDir: string) {
  return (source: CB.Source<Operation>) =>
    CB.pipe(
      source,
      CB.batchUntil(([op]) => op === "mkdir" || op === "rmdir"),
      CB.tap((e) => console.error(e)),
      CB.chain((ops) =>
        CB.chainPar_(CB.fromIter(ops), ([op, file, _entry]) => {
          const path = `${outDir}/${file}`;

          console.log(op.toUpperCase(), file);

          switch (op) {
            case "mkdir":
              return CB.fromCallback((cb) => Fs.mkdir(path, cb));
            case "rmdir":
              return CB.fromCallback((cb) => Fs.rmdir(path, cb));
            case "change":
            case "create":
              return CB.fromCallback((cb) =>
                Fs.writeFile(path, contents[file], cb),
              );
            case "unlink":
              return CB.fromCallback((cb) => Fs.unlink(path, cb));
          }
        }),
      ),
    );
}
