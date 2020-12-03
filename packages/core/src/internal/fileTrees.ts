import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import FSTree, { Operation } from "fs-tree-diff";
import * as fs from "fs";
import { promises as fsp } from "fs";
import * as path from "path";
import { bufferUntil } from "./operators";
import { IConfig } from "./config";

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

export interface IPrecalculateResults {
  contents: IInputContents;
  comparisons: { [file: string]: boolean };
}

export const precalculatePatch = (outDir: string) => (
  configs$: Rx.Observable<IConfig>,
) =>
  configs$.pipe(
    RxOp.flatMap((config) =>
      fsp
        .readFile(path.join(outDir, config.file))
        .then((b) => {
          const a = ensureBuffer(config.contents);
          return {
            config,
            match: a.equals(b),
          };
        })
        .catch(() => ({
          config,
          match: false,
        })),
    ),
    RxOp.reduce(
      ({ contents, comparisons }, { config, match }) => ({
        contents: {
          ...contents,
          [config.file]: config.contents,
        },
        comparisons: {
          ...comparisons,
          [config.file]: match,
        },
      }),
      {
        contents: {},
        comparisons: {},
      } as IPrecalculateResults,
    ),
  );

const ensureBuffer = (v: Buffer | string): Buffer =>
  typeof v === "string" ? Buffer.from(v) : v;

export function calculatePatch(
  a: FSTree,
  b: FSTree,
  { comparisons }: { comparisons: IPrecalculateResults["comparisons"] },
) {
  return b.calculatePatch(a, (a, b) => {
    if (a.isDirectory() || b.isDirectory()) {
      return a.isDirectory() && b.isDirectory();
    }

    return comparisons[a.relativePath] || false;
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
                return fsp.mkdir(path);
              case "rmdir":
                return fsp.rmdir(path);
              case "change":
              case "create":
                return fsp.writeFile(path, contents[file]);
              case "unlink":
                return fsp.unlink(path);
            }
          }),
        ),
      ),
    );
}
