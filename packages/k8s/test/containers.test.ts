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

describe("setContainerResourceRequests", () =>
  runCases([
    {
      it: "sets resources.requests",
      in: K.container("myapp", "image"),
      fn: K.setContainerResourceRequests({
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

describe("setContainerResourceLimits", () =>
  runCases([
    {
      it: "sets resources.limits",
      in: K.container("myapp", "image"),
      fn: K.setContainerResourceLimits({
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
