import * as fs from "fs";
import * as Ini from "ini";
import * as Yaml from "js-yaml";
import * as path from "path";
import { configs, configsToFiles } from "./internal/config";
import {
  calculatePatch,
  executePatch,
  IInputContents,
  toFileTree,
} from "./internal/fileTrees";
import { filesSource } from "./internal/fs";
import * as CB from "strict-callbag-basics";

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

  const inputConfigs = CB.share(
    configs(inputDir, context, formats, format, ignore),
  );
  const inputConfigsArray = CB.toArray(inputConfigs);
  const outputFT = CB.pipe(filesSource(outDir), toFileTree(outDir));
  const inputFT = CB.pipe(inputConfigs, configsToFiles(), toFileTree(inputDir));

  return CB.pipe(
    inputConfigsArray,

    CB.zip(inputFT),
    CB.zip(outputFT),

    CB.chain(([[configs, inputFT], outputFT]) => {
      const contents = configs.reduce((acc, c) => {
        acc[c.file] = c.contents;
        return acc;
      }, {} as any) as IInputContents;

      const patch = calculatePatch(inputFT, outputFT, {
        contents,
        outDir,
      });

      return CB.pipe(CB.fromIter(patch), executePatch(contents, outDir));
    }),

    CB.run_,
  ).finally(() => {
    process.chdir(startDir);
  });
}

export interface IFormat {
  dump(js: any): string;
  load(contents: string): any;
}

const yamlFormat: IFormat = {
  dump: (js) =>
    Yaml.dump(js, { skipInvalid: true, noRefs: true, lineWidth: -1 }),
  load: Yaml.load,
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
