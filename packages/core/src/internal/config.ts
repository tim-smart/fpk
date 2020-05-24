import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import * as path from "path";
import * as R from "ramda";
import { files$ } from "./fs";
import { IFormat } from "../generate";

export interface IConfig
  extends Readonly<{
    file: string;
    contents: string;
  }> {}

export function configs$(
  dir: string,
  context: any,
  formats: Map<string, IFormat>,
  format: string,
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
    RxOp.map(
      R.when<
        { basename: string; contents: any },
        { basename: string; contents: any }
      >(
        R.pipe(
          R.view(R.lensProp("basename")),
          path.basename,
          R.equals("index"),
        ),
        R.over(R.lensProp("basename"), (f) => path.join(f, "..")),
      ),
    ),
    RxOp.flatMap(({ basename, contents }) =>
      Rx.from(Object.keys(contents)).pipe(
        RxOp.flatMap((file) =>
          encodeContents(context, formats, format, contents[file]).pipe(
            RxOp.map((contents) => ({
              file: `${basename}/${file}.${format}`,
              contents,
            })),
          ),
        ),
      ),
    ),
  );
}

export function configsToFiles() {
  return (input$: Rx.Observable<IConfig>) =>
    input$.pipe(RxOp.map((config) => config.file));
}

function resolveFile(file: string) {
  return require(path.resolve(file));
}

function encodeContents(
  context: any,
  formats: Map<string, IFormat>,
  format: string,
  contents: any,
) {
  const dump = formats.get(format)!;

  if (typeof contents === "function") {
    const retContents = contents(context);
    return Rx.from(Promise.resolve(retContents)).pipe(RxOp.map(dump));
  }

  return Rx.of(dump(contents));
}
