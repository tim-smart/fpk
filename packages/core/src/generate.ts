import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import * as R from "ramda";
import yaml from "js-yaml";
import * as fs from "fs";
import { configs$, configsToFiles } from "./internal/config";
import {
  toFileTree,
  IInputContents,
  calculatePatch,
  executePatch,
} from "./internal/fileTrees";
import { files$ } from "./internal/fs";
import * as path from "path";

export interface IGenerateOpts {
  context: any;
  format: string;
}

export function generate(
  inputDir: string,
  outDir: string,
  opts: Partial<IGenerateOpts> = {},
) {
  inputDir = path.resolve(inputDir);
  outDir = path.resolve(outDir);

  const { context, format } = R.mergeRight(
    {
      format: "yaml",
      context: {},
    },
    opts,
  );

  if (!formats.has(format)) {
    throw new Error(`Format ${format} is not registered.`);
  }

  const startDir = process.cwd();
  process.chdir(inputDir);

  try {
    fs.accessSync(outDir, fs.constants.F_OK);
  } catch (_) {
    fs.mkdirSync(outDir);
  }

  const inputConfigs$ = configs$(inputDir, context, formats, format);
  const inputConfigsArray$ = inputConfigs$.pipe(RxOp.toArray());
  const outputFT$ = files$(outDir).pipe(toFileTree(outDir));
  const inputFT$ = inputConfigs$.pipe(configsToFiles(), toFileTree(inputDir));

  return Rx.zip(inputConfigsArray$, inputFT$, outputFT$)
    .pipe(
      RxOp.flatMap(([configs, inputFT, outputFT]) => {
        const contents = R.reduce(
          (acc, c) => R.set(R.lensProp(c.file), c.contents, acc),
          {} as IInputContents,
          configs,
        );

        const patch = calculatePatch(inputFT, outputFT, {
          contents,
          outDir,
        });
        return Rx.from(patch).pipe(executePatch(contents, outDir));
      }),
    )
    .toPromise()
    .finally(() => {
      process.chdir(startDir);
    });
}

export interface IFormat {
  (js: any): string;
}

const formats = new Map<string, IFormat>([
  ["json", (js) => JSON.stringify(js, null, 2)],
  ["yaml", (js) => yaml.safeDump(js, { skipInvalid: true })],
]);

export function registerFormat(name: string, dump: IFormat) {
  formats.set(name, dump);
}

export function availableFormats() {
  return Array.from(formats.keys());
}
