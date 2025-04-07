import { CrossVersionObjectReference } from "kubernetes-types/autoscaling/v1";
import { ObjectMeta } from "kubernetes-types/meta/v1";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource } from "./resources";

export interface IVerticalPodAutoscaler {
  apiVersion?: "autoscaling.k8s.io/v1";
  kind?: "VerticalPodAutoscaler";
  metadata?: ObjectMeta;
  spec: {
    targetRef: CrossVersionObjectReference;
    updatePolicy?: IUpdatePolicy;
    resourcePolicy?: any;
  };
}
export interface IUpdatePolicy {
  updateMode?: "Auto" | "Initial" | "Recreate";
}

/**
 * Creates a vertical pod autoscaler
 */
export const vpa = (
  name: string,
  targetRef: CrossVersionObjectReference,
  updateMode: IUpdatePolicy["updateMode"] = "Auto",
  toMerge?: DeepPartial<IVerticalPodAutoscaler>,
): IVerticalPodAutoscaler =>
  maybeMergeResource<IVerticalPodAutoscaler>(
    resource<IVerticalPodAutoscaler>(
      "autoscaling.k8s.io/v1",
      "VerticalPodAutoscaler",
      name,
      {
        spec: {
          targetRef,
          updatePolicy: {
            updateMode,
          },
        },
      },
    ),
    toMerge,
  );
