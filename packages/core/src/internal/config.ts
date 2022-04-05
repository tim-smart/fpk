import * as Fs from "fs";
import * as path from "path";
import * as R from "ramda";
import * as CB from "strict-callbag-basics";
import { IFormat } from "../generate";
import { filesSource } from "./fs";

export interface IConfig
  extends Readonly<{
    file: string;
    contents: string | Buffer;
  }> {}

/**
 * Streams a list of configuration files from a source directory.
 */
export function configs(
  dir: string,
  context: any,
  formats: Map<string, IFormat>,
  format: string,
  ignore?: string,
): CB.Source<IConfig> {
  return CB.pipe(
    filesSource(dir, ignore),
    CB.groupBy((file) => [".js", ".ts"].includes(path.extname(file))),
    CB.chainPar(([source, isScript]) =>
      isScript
        ? CB.pipe(
            source,
            resolveConfigFromExports(dir, context, formats, format),
          )
        : CB.pipe(source, resolveConfigFromContents(dir)),
    ),
  );
}

/**
 * Streams configuration files from a module.
 */
export const resolveConfigFromExports =
  (dir: string, context: any, formats: Map<string, IFormat>, format: string) =>
  (inputSource: CB.Source<string>): CB.Source<IConfig> =>
    CB.pipe(
      inputSource,
      // For each file, require() it and load its exports
      CB.map((file) => ({
        file,
        exports: resolveFile(file),
      })),

      // We only want files with a "default" export
      CB.filter(R.hasPath(["exports", "default"])),

      // Remove file extensions and de-nest "default" exports
      CB.map(({ file, exports }) => ({
        relativePath: R.pipe(
          R.split("."),
          R.remove(-1, 1),
          R.join("."),
        )(path.relative(dir, file)),
        exports: exports.default,
      })),

      // If we have an "index" file, don't create a directory for it
      CB.map(
        R.when(
          R.pipe(
            (s: { relativePath: string; exports: any }) => s,
            R.view(R.lensProp("relativePath")),
            path.basename,
            R.equals("index"),
          ),
          R.over(R.lensProp("relativePath"), (f) => path.join(f, "..")),
        ),
      ),

      // Map functions / promises to the actual configuration
      CB.chainPar(({ relativePath, exports }) =>
        CB.pipe(
          CB.fromPromise_(
            () => resolveContents(context, exports),
            (e) => e,
          ),
          CB.map((contents) => ({
            relativePath,
            contents,
          })),
        ),
      ),

      // For each key in the configuration create a file with the correct
      // extension for the format.
      CB.chain(({ relativePath, contents }) =>
        CB.fromIter(
          Object.keys(contents).map((file) => {
            const fileContents = contents[file];
            let formatOverride = fileFormat(formats)(file);
            return formatOverride
              ? {
                  file: path.join(`${relativePath}`, `${file}`),
                  format: formatOverride,
                  contents: fileContents,
                }
              : {
                  file: path.join(`${relativePath}`, `${file}.${format}`),
                  format,
                  contents: fileContents,
                };
          }),
        ),
      ),

      // Map functions / promises for file contents, then encode it to the correct
      // format.
      CB.map(({ file, format, contents }) => ({
        file,
        contents: encodeContents(formats, format, contents),
      })),
    );

/**
 * Streams configuration files from non-module files.
 */
export const resolveConfigFromContents =
  (dir: string) =>
  (inputSource: CB.Source<string>): CB.Source<IConfig> =>
    CB.pipe(
      inputSource,
      // Load contents from file
      CB.chainPar((file) =>
        CB.pipe(
          CB.fromCallback<Buffer>((cb) => Fs.readFile(file, cb)),
          CB.map((contents) => ({
            file,
            contents,
          })),
        ),
      ),

      // Make file path relative
      CB.map(({ file, contents }) => ({
        file: path.relative(dir, file),
        contents,
      })),
    );

/**
 * Transforms config objects to file paths
 */
export function configsToFiles() {
  return (inputSource: CB.Source<IConfig>) =>
    CB.map_(inputSource, (c) => c.file);
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

/**
 * Turn functions/promises etc. into the actual configuration.
 */
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
): Promise<TContentsMapResolved<M>> {
  const out: { [key: string]: any } = {};

  for (const key in contentMap) {
    let value: any = await Promise.resolve(contentMap[key]);

    if (typeof value === "function") {
      value = await resolveContents(context, value);
    }

    out[key] = value;
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
  return (file: string) => {
    const ext = path.extname(file).slice(1);
    return formats.has(ext) ? ext : undefined;
  };
}
