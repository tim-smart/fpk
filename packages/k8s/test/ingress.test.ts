import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("ingress", () =>
  runCases([
    {
      it: "creates an ingress resource",
      in: {},
      fn: (_) =>
        K.ingress("myingress", {
          rules: [
            {
              host: "example.com",
              http: {
                paths: [
                  {
                    backend: {
                      serviceName: "myapp",
                      servicePort: 3000,
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: ["example.com"],
              secretName: "myapp-tls-secret",
            },
          ],
        }),
      diff: {
        apiVersion: "networking.k8s.io/v1beta1",
        kind: "Ingress",
        metadata: {
          name: "myingress",
        },
        spec: {
          rules: [
            {
              host: "example.com",
              http: {
                paths: [
                  {
                    backend: {
                      serviceName: "myapp",
                      servicePort: 3000,
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: ["example.com"],
              secretName: "myapp-tls-secret",
            },
          ],
        },
      },
    },
  ]));

describe("ingressFromRules", () =>
  runCases([
    {
      it: "creates an ingress resource from rules",
      in: {},
      fn: (_) =>
        K.ingressFromRules("myingress", {
          tlsAcme: true,
          tlsRedirect: true,
          tlsSecretName: "myapp-tls-secret",
          backend: {
            serviceName: "myapp",
            servicePort: 3000,
          },
          rules: [{ host: "example.com" }],
        }),
      diff: {
        apiVersion: "networking.k8s.io/v1beta1",
        kind: "Ingress",
        metadata: {
          name: "myingress",
          annotations: {
            "ingress.kubernetes.io/force-ssl-redirect": "true",
            "kubernetes.io/tls-acme": "true",
          },
        },
        spec: {
          rules: [
            {
              host: "example.com",
              http: {
                paths: [
                  {
                    backend: {
                      serviceName: "myapp",
                      servicePort: 3000,
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: ["example.com"],
              secretName: "myapp-tls-secret",
            },
          ],
        },
      },
    },
  ]));
