import * as F from "fp-ts/function";
import {
  DaemonSet,
  DaemonSetUpdateStrategy,
  RollingUpdateDaemonSet,
} from "kubernetes-types/apps/v1";
import { Container } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { appendContainer } from "./podTemplates";
import { maybeMergeResource, resource } from "./resources";

/**
 * Create a deployment resource with the given name. The second argument is deep
 * merged into the deployment.
 */
export const daemonSet = (
  name: string,
  toMerge?: DeepPartial<DaemonSet>,
): DaemonSet =>
  maybeMergeResource<DaemonSet>(
    resource<DaemonSet>("apps/v1", "DaemonSet", name, {
      spec: {
        selector: {
          matchLabels: {
            app: name,
          },
        },
        template: {
          metadata: {
            labels: {
              app: name,
            },
          },
          spec: {
            containers: [],
          },
        },
      },
    }),
    toMerge,
  );

/**
 * Creates a daemonset with a single container. Has a couple options to help
 * make creating daemonsets easier.
 */
export const daemonSetWithContainer = (
  name: string,
  container: Container,
  toMerge?: DeepPartial<DaemonSet>,
): DaemonSet =>
  F.pipe(daemonSet(name), appendContainer(container), (d) =>
    maybeMergeResource<DaemonSet>(d, toMerge),
  );

export type TDaemonSetTransform = (d: DaemonSet) => DaemonSet;

/**
 * Returns a function that sets `spec.updateStrategy` to the given strategy.
 */
export const setDaemonSetUpdateStrategy = (
  strategy: DaemonSetUpdateStrategy,
): TDaemonSetTransform =>
  R.set(R.lensPath(["spec", "updateStrategy"]), strategy);

/**
 * Returns a funciton that sets `spec.updateStrategy` to type "Recreate".
 */
export const setDaemonSetOnDelete = (): TDaemonSetTransform =>
  setDaemonSetUpdateStrategy({
    type: "OnDelete",
  });

/**
 * Returns a funciton that sets `spec.updateStrategy` to type "RollingUpdate" with the
 * given options.
 */
export const setDaemonSetRollingUpdate = (
  rollingUpdate: RollingUpdateDaemonSet,
): TDaemonSetTransform =>
  setDaemonSetUpdateStrategy({
    type: "RollingUpdate",
    rollingUpdate,
  });
