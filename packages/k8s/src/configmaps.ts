import { ConfigMap } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import * as R from "ramda";
import { createConfigFromFile } from "./internal/fs";

/**
 * Creates a configmap resource from some data
 */
export const configmap = (
  name: string,
  data: { [name: string]: string },
  toMerge: DeepPartial<ConfigMap> = {},
): ConfigMap =>
  R.mergeDeepRight(
    {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: {
        name,
      },
      data,
    },
    toMerge,
  ) as ConfigMap;

/**
 * Create a configmap from a file
 */
export const configmapFromFile = (
  name: string,
  file: string,
  filename?: string,
  toMerge: DeepPartial<ConfigMap> = {},
) =>
  createConfigFromFile(file, filename).then((data) =>
    configmap(name, data, toMerge),
  );
