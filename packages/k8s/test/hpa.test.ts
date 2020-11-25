import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

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
        apiVersion: "autoscaling/v2beta2",
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
  ]));
