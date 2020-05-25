import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { Container } from "kubernetes-types/core/v1";

describe("container", () =>
  runCases([
    {
      it: "creates a container resource",
      in: {},
      fn: (_) =>
        K.container("myapp", "image/name:latest", {
          imagePullPolicy: "Always",
        }),
      diff: {
        name: "myapp",
        image: "image/name:latest",
        imagePullPolicy: "Always",
      },
    },
  ]));

describe("containerWithPort", () =>
  runCases([
    {
      it: "creates a container resource with a port",
      in: {},
      fn: (_) =>
        K.containerWithPort("myapp", "image/name:latest", 3000, {
          imagePullPolicy: "Always",
        }),
      diff: {
        name: "myapp",
        image: "image/name:latest",
        imagePullPolicy: "Always",
        ports: [{ containerPort: 3000 }],
      },
    },
  ]));

describe("concatEnv", () =>
  runCases([
    {
      it: "adds environment variables for a container",
      in: K.container("myapp", "image"),
      fn: K.concatEnv({
        FOO: "bar",
        BAR: {
          secretKeyRef: {
            name: "mysecret",
            key: "password",
          },
        },
      }),
      diff: {
        env: [
          { name: "FOO", value: "bar" },
          {
            name: "BAR",
            valueFrom: {
              secretKeyRef: {
                name: "mysecret",
                key: "password",
              },
            },
          },
        ],
      } as Container,
    },
  ]));

describe("setResourceRequests", () =>
  runCases([
    {
      it: "sets resources.requests",
      in: K.container("myapp", "image"),
      fn: K.setResourceRequests({
        cpu: "0.5",
        memory: "100M",
      }),
      diff: {
        resources: {
          requests: {
            cpu: "0.5",
            memory: "100M",
          },
        },
      },
    },
  ]));

describe("setResourceLimits", () =>
  runCases([
    {
      it: "sets resources.limits",
      in: K.container("myapp", "image"),
      fn: K.setResourceLimits({
        cpu: "0.5",
        memory: "100M",
      }),
      diff: {
        resources: {
          limits: {
            cpu: "0.5",
            memory: "100M",
          },
        },
      },
    },
  ]));

describe("appendEnvFrom", () =>
  runCases([
    {
      it: "appends envFrom for a container",
      in: K.container("myapp", "image"),
      fn: K.appendEnvFrom({
        configMapRef: {
          name: "myconfig",
        },
      }),
      diff: {
        envFrom: [
          {
            configMapRef: {
              name: "myconfig",
            },
          },
        ],
      } as Container,
    },
  ]));

describe("appendVolumeMount", () =>
  runCases([
    {
      it: "appends volumeMount for a container",
      in: K.container("myapp", "image"),
      fn: K.appendVolumeMount("myvolume", "/mnt/volume", { readOnly: true }),
      diff: {
        volumeMounts: [
          {
            name: "myvolume",
            mountPath: "/mnt/volume",
            readOnly: true,
          },
        ],
      } as Container,
    },
  ]));

describe("setReadinessProbe", () =>
  runCases([
    {
      it: "sets readinessProbe for a container",
      in: K.containerWithPort("myapp", "image", 80),
      fn: K.setReadinessProbe({
        timeoutSeconds: 10,
      }),
      diff: {
        readinessProbe: {
          httpGet: {
            port: 80,
            path: "/",
          },
          timeoutSeconds: 10,
        },
      } as Container,
    },
  ]));

describe("setLivenessProbe", () =>
  runCases([
    {
      it: "sets livenessProbe for a container",
      in: K.containerWithPort("myapp", "image", 80),
      fn: K.setLivenessProbe({
        timeoutSeconds: 10,
      }),
      diff: {
        livenessProbe: {
          httpGet: {
            port: 80,
            path: "/",
          },
          timeoutSeconds: 10,
        },
      } as Container,
    },
  ]));

describe("setImagePullPolicy", () =>
  runCases([
    {
      it: "sets imagePullPolicy for a container",
      in: K.containerWithPort("myapp", "image", 80),
      fn: K.setImagePullPolicy("Always"),
      diff: {
        imagePullPolicy: "Always",
      } as Container,
    },
  ]));
