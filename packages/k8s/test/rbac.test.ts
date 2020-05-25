import * as K from "../src/index";
import * as R from "ramda";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { ClusterRole } from "kubernetes-types/rbac/v1";

describe("serviceAccount", () =>
  runCases([
    {
      it: "creates a ServiceAccount",
      in: {},
      fn: R.always(
        K.serviceAccount("mysa", {
          secrets: [],
        }),
      ),
      diff: {
        apiVersion: "v1",
        kind: "ServiceAccount",
        metadata: {
          name: "mysa",
        },
        secrets: [],
      },
    },
  ]));

describe("rbac", () =>
  runCases([
    {
      it: "can create rbac resources",
      in: {},
      fn: R.always(
        K.rbac<ClusterRole>("ClusterRole", "mycr", { rules: [] }),
      ),
      diff: {
        apiVersion: "rbac.authorization.k8s.io/v1",
        kind: "ClusterRole",
        metadata: {
          name: "mycr",
        },
        rules: [],
      },
    },
  ]));
