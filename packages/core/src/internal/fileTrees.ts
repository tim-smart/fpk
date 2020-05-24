import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import FSTree, { Operation } from "fs-tree-diff";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";

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
    [file: string]: string;
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

    const aContent = contents[a.relativePath];
    const bContent = fs
      .readFileSync(path.join(outDir, b.relativePath))
      .toString("utf8");

    return aContent.trim() === bContent.trim();
  });
}

export function executePatch(contents: IInputContents, outDir: string) {
  return (input$: Rx.Observable<Operation>) =>
    input$.pipe(
      RxOp.concatMap(([op, file, _entry]) => {
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
    );
}
