import { promises as fs } from "fs";
import { basename } from "path";

export const createConfigFromFile = (file: string, filename?: string) =>
  fs.readFile(file).then((blob) => {
    const key = filename || basename(file);
    return { [key]: blob.toString("utf8") };
  });
