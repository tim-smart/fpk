import { Secret, Volume, ConfigMap } from "kubernetes-types/core/v1";

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
