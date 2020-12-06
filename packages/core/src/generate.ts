import * as fs from "fs";
import * as Ini from "ini";
import yaml from "js-yaml";
import * as path from "path";
import * as R from "ramda";
import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import { configs$, configsToFiles } from "./internal/config";
import {
  calculatePatch,
  executePatch,
  IInputContents,
  toFileTree,
} from "./internal/fileTrees";
import { files$ } from "./internal/fs";

export interface IGenerateOpts {
  context: any;
  format: string;
  ignore?: string;
}

export function generate(
  inputDir: string,
  outDir: string,
  { format = "yaml", context = {}, ignore }: Partial<IGenerateOpts> = {},
) {
  inputDir = path.resolve(inputDir);
  outDir = path.resolve(outDir);

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

  const inputConfigs$ = configs$(inputDir, context, formats, format, ignore);
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
  dump(js: any): string;
  load(contents: string): any;
}

const yamlFormat: IFormat = {
  dump: (js) =>
    yaml.safeDump(js, { skipInvalid: true, noRefs: true, lineWidth: -1 }),
  load: yaml.safeLoad,
};

const formats = new Map<string, IFormat>([
  [
    "json",
    {
      dump: (js) => JSON.stringify(js, null, 2),
      load: JSON.parse,
    },
  ],
  ["yaml", yamlFormat],
  ["yml", yamlFormat],
  [
    "ini",
    {
      dump: (js) => Ini.stringify(js),
      load: Ini.parse,
    },
  ],
]);

export function registerFormat(name: string, dump: IFormat) {
  formats.set(name, dump);
}

export function availableFormats() {
  return Array.from(formats.keys());
}
