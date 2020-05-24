import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("deployment", () =>
  runCases([
    {
      it: "creates a basic deployment",
      in: {},
      fn: (_) => K.deployment("fancyapp"),
      diff: {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: "fancyapp",
          labels: {
            app: "fancyapp",
          },
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: "fancyapp",
            },
          },
          template: {
            metadata: {
              labels: {
                app: "fancyapp",
              },
            },
            spec: {
              containers: [],
            },
          },
        },
      },
    },

    {
      it: "merges in the second argument",
      in: K.deployment("fancyapp"),
      fn: (_) =>
        K.deployment("fancyapp", {
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    name: "fancyapp",
                    image: "fancyimage",
                  },
                ],
                volumes: [],
              },
            },
          },
        }),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": {
                  name: "fancyapp",
                  image: "fancyimage",
                },
              },
              volumes: [],
            },
          },
        },
      },
    },
  ]));

describe("setReplicas", () =>
  runCases([
    {
      it: "sets the number of replicas",
      in: K.deployment("fancyapp"),
      fn: K.setReplicas(5),
      diff: { spec: { replicas: 5 } },
    },
  ]));

describe("setDeploymentStrategy", () =>
  runCases([
    {
      it: "sets spec.strategy",
      in: K.deployment("fancyapp"),
      fn: K.setDeploymentStrategy({ type: "Recreate" }),
      diff: { spec: { strategy: { type: "Recreate" } } },
    },
  ]));

describe("setDeploymentRecreate", () =>
  runCases([
    {
      it: "sets spec.strategy to Recreate",
      in: K.deployment("fancyapp"),
      fn: K.setDeploymentRecreate(),
      diff: { spec: { strategy: { type: "Recreate" } } },
    },
  ]));

describe("setDeploymentRollingUpdate", () =>
  runCases([
    {
      it: "sets spec.strategy to RollingUpdate",
      in: K.deployment("fancyapp"),
      fn: K.setDeploymentRollingUpdate({
        maxSurge: 5,
        maxUnavailable: 0,
      }),
      diff: {
        spec: {
          strategy: {
            type: "RollingUpdate",
            rollingUpdate: {
              maxSurge: 5,
              maxUnavailable: 0,
            },
          },
        },
      },
    },
  ]));