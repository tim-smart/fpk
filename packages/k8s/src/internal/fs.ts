import { readFile } from "fs/promises";
import { basename } from "path";

export const createConfigFromFile = (file: string, filename?: string) =>
  readFile(file).then((blob) => {
    const key = filename || basename(file);
    return { [key]: blob.toString("utf8") };
  });
