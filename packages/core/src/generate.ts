import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import yaml from "js-yaml";
import * as fs from "fs";
import * as Ini from "ini";
import { configs$, configsToFiles } from "./internal/config";
import {
  toFileTree,
  calculatePatch,
  executePatch,
  precalculatePatch,
} from "./internal/fileTrees";
import { files$ } from "./internal/fs";
import * as path from "path";

export interface IGenerateOpts {
  context: any;
  format: string;
  ignore?: string;
}

export function generate(
  inputDir: string,
  outDir: string,
  { format = "yaml", context = {}, ignore }: Partial<IGenerateOpts> = {}
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
  const inputPatch$ = inputConfigs$.pipe(precalculatePatch(outDir));
  const outputFT$ = files$(outDir).pipe(toFileTree(outDir));
  const inputFT$ = inputConfigs$.pipe(configsToFiles(), toFileTree(inputDir));

  const pipeline = Rx.zip(inputPatch$, inputFT$, outputFT$).pipe(
    RxOp.flatMap(([{ contents, comparisons }, inputFT, outputFT]) => {
      const patch = calculatePatch(inputFT, outputFT, {
        comparisons,
      });
      return Rx.from(patch).pipe(executePatch(contents, outDir));
    })
  );

  return Rx.lastValueFrom(pipeline).finally(() => {
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
