import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import { Operation } from "fs-tree-diff";
import * as fs from "fs";
import { promises as fsp } from "fs";
import * as path from "path";
import { bufferUntil } from "./operators";

import FSTree = require("fs-tree-diff");

export function toFileTree(dir: string) {
  return (input$: Rx.Observable<string>) =>
    input$.pipe(
      RxOp.map((file) => path.relative(dir, file)),
      RxOp.toArray(),
      RxOp.map((files) => FSTree.fromPaths(files, { sortAndExpand: true })),
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
    const bContent = fs.readFileSync(path.join(outDir, b.relativePath));

    return aContent.compare(bContent) === 0;
  });
}

export function executePatch(contents: IInputContents, outDir: string) {
  return (input$: Rx.Observable<Operation>) =>
    input$.pipe(
      bufferUntil(([op]) => op === "mkdir" || op === "rmdir"),
      RxOp.concatMap((ops) =>
        Rx.from(ops).pipe(
          RxOp.mergeMap(([op, file, _entry]) => {
            const path = `${outDir}/${file}`;

            console.log(op.toUpperCase(), file);

            switch (op) {
              case "mkdir":
                return Rx.from(fsp.mkdir(path));
              case "rmdir":
                return Rx.from(fsp.rmdir(path));
              case "change":
              case "create":
                return Rx.from(fsp.writeFile(path, contents[file]));
              case "unlink":
                return Rx.from(fsp.unlink(path));
            }
          }),
        ),
      ),
    );
}
