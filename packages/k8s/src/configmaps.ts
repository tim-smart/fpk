import { ConfigMap } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import { createConfigFromFile, createConfigFromDir } from "./internal/fs";
import { maybeMergeResource, resource } from "./resources";

/**
 * Creates a configmap resource from some data
 */
export const configMap = (
  name: string,
  data: { [name: string]: string },
  toMerge?: DeepPartial<ConfigMap>,
): ConfigMap =>
  maybeMergeResource<ConfigMap>(
    resource<ConfigMap>("v1", "ConfigMap", name, { data }),
    toMerge,
  );

/**
 * Create a configmap from a file
 */
export const configMapFromFile = (
  name: string,
  file: string,
  filename?: string,
  toMerge?: DeepPartial<ConfigMap>,
) => configMap(name, createConfigFromFile(file, filename), toMerge);

/**
 * Create a configmap from a directory. Each file in the directory will have its
 * own entry
 */
export const configMapFromDir = (
  name: string,
  dir: string,
  toMerge?: DeepPartial<ConfigMap>,
) => configMap(name, createConfigFromDir(dir), toMerge);
