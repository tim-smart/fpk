import { CrossVersionObjectReference } from "kubernetes-types/autoscaling/v1";
import { ObjectMeta } from "kubernetes-types/meta/v1";
import { DeepPartial } from "./common";
import * as R from "ramda";

export interface IVerticalPodAutoscaler {
  apiVersion: "autoscaling.k8s.io/v1beta2";
  kind: "VerticalPodAutoscaler";
  metadata: ObjectMeta;
  spec: {
    targetRef: CrossVersionObjectReference;
    updatePolicy?: IUpdatePolicy;
    // TODO
    resourcePolicy: any;
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
  toMerge: DeepPartial<IVerticalPodAutoscaler> = {},
): IVerticalPodAutoscaler =>
  R.mergeDeepRight(
    {
      apiVersion: "autoscaling.k8s.io/v1beta2",
      kind: "VerticalPodAutoscaler",
      metadata: {
        name,
      },
      spec: {
        targetRef,
        updatePolicy: {
          updateMode,
        },
      },
    },
    toMerge,
  ) as IVerticalPodAutoscaler;
