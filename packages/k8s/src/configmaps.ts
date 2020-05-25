import { ConfigMap } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import { createConfigFromFile } from "./internal/fs";
import { maybeMergeResource, resource } from "./resources";

/**
 * Creates a configmap resource from some data
 */
export const configmap = (
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
export const configmapFromFile = (
  name: string,
  file: string,
  filename?: string,
  toMerge?: DeepPartial<ConfigMap>,
) =>
  createConfigFromFile(file, filename).then((data) =>
    configmap(name, data, toMerge),
  );
