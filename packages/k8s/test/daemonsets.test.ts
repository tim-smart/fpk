import * as K from "../src/index";
import * as R from "ramda";
import * as F from "fp-ts/function";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { DaemonSet } from "kubernetes-types/apps/v1";

describe("daemonSet", () =>
  runCases([
    {
      it: "creates a basic daemonSet",
      in: {},
      fn: (_) => K.daemonSet("fancyapp"),
      diff: {
        apiVersion: "apps/v1",
        kind: "DaemonSet",
        metadata: {
          name: "fancyapp",
        },
        spec: {
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
      in: K.daemonSet("fancyapp"),
      fn: (_) =>
        K.daemonSet("fancyapp", {
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

describe("daemonSetWithContainer", () =>
  runCases([
    {
      it: "creates a daemonSet with a container",
      in: K.daemonSet("myds"),
      fn: (_) =>
        K.daemonSetWithContainer(
          "myds",
          F.pipe(
            K.containerWithPort("fancyapp", "fancyimage", 3000),
            K.concatEnv({ FOO: "bar" }),
            K.setResourceRequests({ cpu: "1", memory: "100M" }),
          ),
        ),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": {
                  name: "fancyapp",
                  image: "fancyimage",
                  ports: [{ containerPort: 3000 }],
                  env: [{ name: "FOO", value: "bar" }],
                  resources: {
                    requests: {
                      cpu: "1",
                      memory: "100M",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ]));

describe("setDaemonSetStrategy", () =>
  runCases([
    {
      it: "sets spec.updateStrategy",
      in: K.daemonSet("fancyapp"),
      fn: K.setDaemonSetUpdateStrategy({ type: "OnDelete" }),
      diff: { spec: { updateStrategy: { type: "OnDelete" } } },
    },
  ]));

describe("setDaemonSetRecreate", () =>
  runCases([
    {
      it: "sets spec.strategy to Recreate",
      in: K.daemonSet("fancyapp"),
      fn: K.setDaemonSetOnDelete(),
      diff: { spec: { updateStrategy: { type: "OnDelete" } } },
    },
  ]));

describe("setDaemonSetRollingUpdate", () =>
  runCases([
    {
      it: "sets spec.strategy to RollingUpdate",
      in: K.daemonSet("fancyapp"),
      fn: K.setDaemonSetRollingUpdate({
        maxUnavailable: 1,
      }),
      diff: {
        spec: {
          updateStrategy: {
            type: "RollingUpdate",
            rollingUpdate: {
              maxUnavailable: 1,
            },
          },
        },
      },
    },
  ]));

describe("setRevisionHistory", () =>
  runCases([
    {
      it: "sets revisionHistoryLimit",
      in: K.daemonSet("fancyapp"),
      fn: K.setRevisionHistory(5),
      diff: {
        spec: {
          revisionHistoryLimit: 5,
        },
      } as DaemonSet,
    },
  ]));
