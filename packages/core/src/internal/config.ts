import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import * as path from "path";
import * as R from "ramda";
import { files$ } from "./fs";
import { IFormat } from "../generate";
import { promises as fsp } from "fs";

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
    RxOp.flatMap((file) => {
      if ([".js", ".ts"].includes(path.extname(file))) {
        return Rx.of(file).pipe(
          resolveConfigFromExports(dir, context, formats, format),
        );
      }

      return Rx.of(file).pipe(resolveConfigFromContents(dir));
    }),
  );
}

export const resolveConfigFromExports = (
  dir: string,
  context: any,
  formats: Map<string, IFormat>,
  format: string,
) => (input$: Rx.Observable<string>) =>
  input$.pipe(
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
      Rx.from(resolveContents(context, exports)).pipe(
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
        // Determine the format for the file
        RxOp.map((file) => {
          const fileContents = contents[file];
          let formatOverride = fileFormat(formats)(file);
          return formatOverride
            ? {
                file: `${relativePath}/${file}`,
                format: formatOverride,
                contents: fileContents,
              }
            : {
                file: `${relativePath}/${file}.${format}`,
                format,
                contents: fileContents,
              };
        }),
      ),
    ),

    // Map functions / promises for file contents, then encode it to the correct
    // format.
    RxOp.map(({ file, format, contents }) => ({
      file,
      contents: encodeContents(formats, format, contents),
    })),
  );

export const resolveConfigFromContents = (dir: string) => (
  input$: Rx.Observable<string>,
) =>
  input$.pipe(
    // Load contents from file
    RxOp.flatMap((file) =>
      Rx.from(fsp.readFile(file)).pipe(
        RxOp.map((blob) => ({
          file,
          contents: blob.toString("utf8"),
        })),
      ),
    ),

    // Remove file extensions and de-nest "default" exports
    RxOp.map(({ file, contents }) => ({
      file: path.relative(dir, file),
      contents,
    })),
  );

export function configsToFiles() {
  return (input$: Rx.Observable<IConfig>) =>
    input$.pipe(RxOp.map((config) => config.file));
}

function resolveFile(file: string) {
  const module = require.resolve(file);
  return require(module);
}

type TContentsAsyncFunction<T> = (ctx: any) => Promise<T>;
type TContentsFunction<T> = (ctx: any) => T;
type TContentsFn<T> = TContentsAsyncFunction<T> | TContentsFunction<T>;

export type TContents<T> = TContentsFn<T> | Promise<T> | T;

type TExtractContentType<C> = C extends TContents<infer T> ? T : never;
type TContentsMapResolved<M> = { [K in keyof M]: TExtractContentType<M[K]> };

export function resolveContents<T>(context: any, contents: TContents<T>) {
  if (typeof contents === "function") {
    const fn = contents as TContentsFn<T>;
    const retContents = fn(context);

    return Promise.resolve(retContents).then((contents: T) =>
      resolveContentMap(context, contents),
    );
  }

  return Promise.resolve(contents).then((contents: T) =>
    resolveContentMap(context, contents),
  );
}

export async function resolveContentMap<M extends { [key: string]: any }>(
  context: any,
  contentMap: M,
) {
  let out = {};

  for (const key in contentMap) {
    let value: any = await Promise.resolve(contentMap[key]);

    if (typeof value === "function") {
      value = await resolveContents(context, value);
    }

    out = R.assoc(key, value, out);
  }

  return out as TContentsMapResolved<M>;
}

function encodeContents(
  formats: Map<string, IFormat>,
  format: string,
  contents: any,
) {
  const { dump } = formats.get(format)!;
  return dump(contents);
}

function fileFormat(formats: Map<string, IFormat>) {
  return R.pipe<string, string, string, string | undefined>(
    path.extname,
    R.slice(1, Infinity),
    R.when(
      R.either(R.isEmpty, (ext) => !formats.has(ext)),
      R.always(undefined),
    ),
  );
}
