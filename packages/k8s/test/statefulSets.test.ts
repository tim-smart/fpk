import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import * as R from "ramda";

describe("statefulSet", () =>
  runCases([
    {
      it: "creates a basic statefulSet",
      in: {},
      fn: (_) => K.statefulSet("fancyapp", "svc"),
      diff: {
        apiVersion: "apps/v1",
        kind: "StatefulSet",
        metadata: {
          name: "fancyapp",
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: "fancyapp",
            },
          },
          serviceName: "svc",
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
      in: K.statefulSet("fancyapp", "svc"),
      fn: (_) =>
        K.statefulSet("fancyapp", "svc", {
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

describe("statefulSetWithContainer", () =>
  runCases([
    {
      it: "creates a statefulSet with a container",
      in: K.statefulSet("fancyapp-deploy", "svc"),
      fn: (_) =>
        R.pipe(
          R.always(
            K.statefulSetWithContainer(
              "fancyapp-deploy",
              "svc",
              R.pipe(
                R.always(
                  K.containerWithPorts("fancyapp", "fancyimage", {
                    http: 3000,
                  }),
                ),
                K.concatEnv({ FOO: "bar" }),
                K.setResourceRequests({ cpu: "1", memory: "100M" }),
              )(),
            ),
          ),
          K.setReplicas(5),
        )(),
      diff: {
        spec: {
          replicas: 5,
          template: {
            spec: {
              containers: {
                "0": {
                  name: "fancyapp",
                  image: "fancyimage",
                  ports: [{ name: "http", containerPort: 3000 }],
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

describe("setReplicas", () =>
  runCases([
    {
      it: "sets the number of replicas",
      in: K.statefulSet("fancyapp", "svc"),
      fn: K.setReplicas(5),
      diff: { spec: { replicas: 5 } },
    },
  ]));

describe("setStatefulSetUpdateStrategy", () =>
  runCases([
    {
      it: "sets spec.strategy",
      in: K.statefulSet("fancyapp", "svc"),
      fn: K.setStatefulSetUpdateStrategy({ type: "Recreate" }),
      diff: { spec: { updateStrategy: { type: "Recreate" } } },
    },
  ]));

describe("setStatefulSetOnDelete", () =>
  runCases([
    {
      it: "sets spec.strategy to OnDelete",
      in: K.statefulSet("fancyapp", "svc"),
      fn: K.setStatefulSetOnDelete(),
      diff: { spec: { updateStrategy: { type: "OnDelete" } } },
    },
  ]));

describe("setStatefulSetRollingUpdate", () =>
  runCases([
    {
      it: "sets spec.strategy to RollingUpdate",
      in: K.statefulSet("fancyapp", "svc"),
      fn: K.setStatefulSetRollingUpdate({
        partition: 2,
      }),
      diff: {
        spec: {
          updateStrategy: {
            type: "RollingUpdate",
            rollingUpdate: {
              partition: 2,
            },
          },
        },
      },
    },
  ]));

describe("setStatefulSetRollingUpdate", () =>
  runCases([
    {
      it: "sets spec.strategy to RollingUpdate",
      in: K.statefulSet("fancyapp", "svc"),
      fn: K.setRevisionHistory(5),
      diff: {
        spec: {
          revisionHistoryLimit: 5,
        },
      },
    },
  ]));
