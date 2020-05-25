import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("vpa", () =>
  runCases([
    {
      it: "creates a vertical pod autoscaler",
      in: {},
      fn: (_) =>
        K.vpa("myvpa", {
          apiVersion: "apps/v1",
          kind: "Deployment",
          name: "myapp",
        }),
      diff: {
        apiVersion: "autoscaling.k8s.io/v1beta2",
        kind: "VerticalPodAutoscaler",
        metadata: {
          name: "myvpa",
        },
        spec: {
          targetRef: {
            apiVersion: "apps/v1",
            kind: "Deployment",
            name: "myapp",
          },
          updatePolicy: { updateMode: "Auto" },
        },
      },
    },
  ]));
