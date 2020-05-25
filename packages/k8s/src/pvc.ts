import { PersistentVolumeClaim } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import * as R from "ramda";

export const pvc = (
  name: string,
  storage: string,
  toMerge: DeepPartial<PersistentVolumeClaim> = {},
): PersistentVolumeClaim =>
  R.mergeDeepRight(
    {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: {
        name,
      },
      spec: {
        accessModes: ["ReadWriteOnce"],
        resources: {
          requests: {
            storage,
          },
        },
      },
    },
    toMerge,
  ) as PersistentVolumeClaim;
