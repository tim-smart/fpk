import {
  HorizontalPodAutoscaler,
  HorizontalPodAutoscalerSpec,
} from "kubernetes-types/autoscaling/v2beta2";
import * as R from "ramda";
import { DeepPartial } from "./common";

export const hpa = (
  name: string,
  spec: HorizontalPodAutoscalerSpec,
  toMerge: DeepPartial<HorizontalPodAutoscaler> = {},
): HorizontalPodAutoscaler =>
  R.mergeDeepRight(
    {
      apiVersion: "autoscaling/v2beta2",
      kind: "HorizontalPodAutoscaler",
      metadata: {
        name,
      },
      spec,
    } as HorizontalPodAutoscaler,
    toMerge,
  ) as HorizontalPodAutoscaler;
