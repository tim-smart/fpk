import {
  Secret,
  Volume,
  ConfigMap,
  PersistentVolumeClaim,
} from "kubernetes-types/core/v1";

/**
 * Create a volume from a secret
 */
export const volumeFromSecret = (name: string, secret: Secret): Volume => ({
  name,
  secret: {
    secretName: secret.metadata!.name,
  },
});

/**
 * Create a volume from a configmap
 */
export const volumeFromConfigMap = (name: string, cm: ConfigMap): Volume => ({
  name,
  configMap: {
    name: cm.metadata!.name,
  },
});

/**
 * Create a volume from a pvc
 */
export const volumeFromPvc = (
  name: string,
  pvc: PersistentVolumeClaim,
  readOnly = false,
): Volume => ({
  name,
  persistentVolumeClaim: {
    claimName: pvc.metadata!.name!,
    readOnly,
  },
});

/**
 * Create a volume from a host directory
 */
export const volumeFromHostPath = (name: string, path: string): Volume => ({
  name,
  hostPath: {
    path,
  },
});
