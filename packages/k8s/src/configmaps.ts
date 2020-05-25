import { ConfigMap } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import * as R from "ramda";

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
