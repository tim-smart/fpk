import { PersistentVolumeClaim } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource } from "./resources";

export const pvc = (
  name: string,
  storage: string,
  toMerge?: DeepPartial<PersistentVolumeClaim>,
): PersistentVolumeClaim =>
  maybeMergeResource<PersistentVolumeClaim>(
    resource<PersistentVolumeClaim>("v1", "PersistentVolumeClaim", name, {
      spec: {
        accessModes: ["ReadWriteOnce"],
        resources: {
          requests: {
            storage,
          },
        },
      },
    }),
    toMerge,
  );
