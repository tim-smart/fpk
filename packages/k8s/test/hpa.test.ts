import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { HorizontalPodAutoscaler } from "kubernetes-types/autoscaling/v2";

describe("hpa", () =>
  runCases([
    {
      it: "creates a horizontal pod autoscaler",
      in: {},
      fn: (_) =>
        K.hpa(
          "myhpa",
          {
            apiVersion: "v1",
            kind: "Deployment",
            name: "myapp",
          },
          {
            metadata: {
              labels: { test: "ing" },
            },
            spec: {
              minReplicas: 1,
              maxReplicas: 5,
            },
          },
        ),
      diff: {
        apiVersion: "autoscaling/v2",
        kind: "HorizontalPodAutoscaler",
        metadata: {
          name: "myhpa",
          labels: { test: "ing" },
        },
        spec: {
          minReplicas: 1,
          maxReplicas: 5,
          scaleTargetRef: {
            apiVersion: "v1",
            kind: "Deployment",
            name: "myapp",
          },
        },
      },
    },
    {
      it: "addAutoscalerMetric adds a metric",
      in: K.hpa("myhpa", {
        apiVersion: "v1",
        kind: "Deployment",
        name: "myapp",
      }),
      fn: K.addAutoscalerMetric({ type: "Resource" }),
      diff: {
        spec: {
          metrics: [
            {
              type: "Resource",
            },
          ],
        },
      } as HorizontalPodAutoscaler,
    },
    {
      it: "addAutoscalerCPUTarget adds a metric",
      in: K.hpa("myhpa", {
        apiVersion: "v1",
        kind: "Deployment",
        name: "myapp",
      }),
      fn: K.addAutoscalerCPUTarget({
        type: "Utilization",
        averageUtilization: 75,
      }),
      diff: {
        spec: {
          metrics: [
            {
              type: "Resource",
              resource: {
                name: "cpu",
                target: {
                  type: "Utilization",
                  averageUtilization: 75,
                },
              },
            },
          ],
        },
      } as HorizontalPodAutoscaler,
    },
    {
      it: "addTargetCPUUtilization adds a metric",
      in: K.hpa("myhpa", {
        apiVersion: "v1",
        kind: "Deployment",
        name: "myapp",
      }),
      fn: K.addTargetCPUUtilization(5),
      diff: {
        spec: {
          metrics: [
            {
              type: "Resource",
              resource: {
                name: "cpu",
                target: {
                  type: "Utilization",
                  averageUtilization: 5,
                },
              },
            },
          ],
        },
      } as HorizontalPodAutoscaler,
    },
  ]));
