import * as fs from "fs";
import { basename, join } from "path";

export const createConfigFromFile = (file: string, filename?: string) => ({
  [filename || basename(file)]: fs.readFileSync(file, { encoding: "utf8" }),
});

export const createConfigFromDir = (
  directory: string,
): { [file: string]: string } => {
  const files = fs.readdirSync(directory);
  return files.reduce(
    (acc, file) => ({
      ...acc,
      ...createConfigFromFile(join(directory, file), file),
    }),
    {},
  );
};
