import { loadAll } from "js-yaml";
import { readFileSync } from "fs";
import { IResource } from "./resources";

export const bundleFromFile = (file: string, prefix = 10) => {
  const content = readFileSync(file, { encoding: "utf8" });
  const decoded = loadAll(content) as IResource[];
  let counter = prefix;

  return decoded.reduce((acc, resource) => {
    const suffix = resource.kind?.toLowerCase() ?? "bundle";
    const name = `${counter++}-${suffix}`;

    return {
      ...acc,
      [name]: resource,
    };
  }, {} as Record<string, unknown>);
};
