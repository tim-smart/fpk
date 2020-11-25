import {
  Secret,
  Volume,
  ConfigMap,
  PersistentVolumeClaim,
  SecretVolumeSource,
  ConfigMapVolumeSource,
  PersistentVolumeClaimVolumeSource,
  HostPathVolumeSource,
} from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import { maybeMergeResource } from "./resources";

/**
 * Create a volume from a secret
 */
export const volumeFromSecret = (
  name: string,
  secret: Secret,
  toMerge?: DeepPartial<SecretVolumeSource>,
): Volume => ({
  name,
  secret: maybeMergeResource<SecretVolumeSource>(
    {
      secretName: secret.metadata!.name,
    },
    toMerge,
  ),
});

/**
 * Create a volume from a configmap
 */
export const volumeFromConfigMap = (
  name: string,
  cm: ConfigMap,
  toMerge?: DeepPartial<ConfigMapVolumeSource>,
): Volume => ({
  name,
  configMap: maybeMergeResource<ConfigMapVolumeSource>(
    {
      name: cm.metadata!.name,
    },
    toMerge,
  ),
});

/**
 * Create a volume from a pvc
 */
export const volumeFromPvc = (
  name: string,
  pvc: PersistentVolumeClaim,
  toMerge?: DeepPartial<PersistentVolumeClaimVolumeSource>,
): Volume => ({
  name,
  persistentVolumeClaim: maybeMergeResource<PersistentVolumeClaimVolumeSource>(
    {
      claimName: pvc.metadata!.name!,
    },
    toMerge,
  ),
});

/**
 * Create a volume from a host directory
 */
export const volumeFromHostPath = (
  name: string,
  path: string,
  toMerge?: DeepPartial<HostPathVolumeSource>,
): Volume => ({
  name,
  hostPath: maybeMergeResource<HostPathVolumeSource>(
    {
      path,
    },
    toMerge,
  ),
});
