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
    // For each file, require() it and load its exports
    RxOp.map((file) => ({
      file,
      exports: resolveFile(file),
    })),

    // We only want files with a "default" export
    RxOp.filter(R.hasPath(["exports", "default"])),

    // Remove file extensions and de-nest "default" exports
    RxOp.map(({ file, exports }) => ({
      relativePath: R.pipe(
        R.split("."),
        R.remove(-1, 1),
        R.join("."),
      )(path.relative(dir, file)),
      exports: exports.default,
    })),

    // If we have an "index" file, don't create a directory for it
    RxOp.map(
      R.when<
        { relativePath: string; exports: any },
        { relativePath: string; exports: any }
      >(
        R.pipe(
          R.view(R.lensProp("relativePath")),
          path.basename,
          R.equals("index"),
        ),
        R.over(R.lensProp("relativePath"), (f) => path.join(f, "..")),
      ),
    ),

    // Map functions / promises to the actual configuration
    RxOp.flatMap(({ relativePath, exports }) =>
      resolveContents(context, exports).pipe(
        RxOp.map((contents) => ({
          relativePath,
          contents,
        })),
      ),
    ),

    // For each key in the configuration create a file with the correct
    // extension for the format.
    RxOp.flatMap(({ relativePath, contents }) =>
      Rx.from(Object.keys(contents)).pipe(
        RxOp.map((file) => ({
          file: `${relativePath}/${file}.${format}`,
          contents: contents[file],
        })),
      ),
    ),

    // Map functions / promises for file contents, then encode it to the correct
    // format.
    RxOp.flatMap(({ file, contents }) =>
      resolveContents(context, contents).pipe(
        RxOp.map((fileContents) => ({
          file,
          contents: encodeContents(formats, format, fileContents),
        })),
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

function resolveContents(context: any, contents: any) {
  if (typeof contents === "function") {
    const retContents = contents(context);
    return Rx.from(Promise.resolve(retContents));
  }

  return Rx.of(contents);
}

function encodeContents(
  formats: Map<string, IFormat>,
  format: string,
  contents: any,
) {
  const dump = formats.get(format)!;
  return dump(contents);
}
