import {
  Ingress,
  IngressSpec,
  IngressBackend,
  IngressRule,
  IngressTLS,
} from "kubernetes-types/networking/v1beta1";
import * as R from "ramda";
import { DeepPartial, annotate } from "./common";

export const ingress = (
  name: string,
  spec: IngressSpec,
  toMerge: DeepPartial<Ingress> = {},
): Ingress =>
  R.mergeDeepRight(
    {
      apiVersion: "networking.k8s.io/v1beta1",
      kind: "Ingress",
      metadata: {
        name,
      },
      spec,
    } as Ingress,
    toMerge,
  ) as Ingress;

export interface IIngressRules {
  backend: IngressBackend;
  rules: IIngressRule[];

  tlsAcme?: boolean;
  tlsSecretName?: string;
  tlsRedirect?: boolean;
}

export interface IIngressRule {
  host: string;
  paths?: string[];
}

type IngressSpecTransformer = (i: IngressSpec) => IngressSpec;

const rulesToSpec = ({
  backend,
  rules,
  tlsSecretName,
  tlsAcme,
  tlsRedirect,
}: IIngressRules): IngressSpec => {
  const ingress: IngressSpec = {
    rules: R.map(
      ({ host, paths }): IngressRule => ({
        host,
        http: {
          paths: R.ifElse(
            R.isNil,
            () => [{ backend }],
            R.map((path: string) => ({
              path,
              backend,
            })),
          )(paths),
        },
      }),
      rules,
    ),
  };

  return R.pipe(
    R.when<IngressSpec, IngressSpec>(
      () => !R.isNil(tlsSecretName),
      R.set(R.lensProp("tls"), [
        {
          hosts: R.map((rule) => rule.host, rules),
          secretName: tlsSecretName,
        },
      ]),
    ),
  )(ingress);
};

export const ingressFromRules = (
  name: string,
  rules: IIngressRules,
  toMerge: DeepPartial<Ingress> = {},
) =>
  R.pipe(
    R.when<Ingress, Ingress>(
      () => rules.tlsAcme === true,
      annotate("kubernetes.io/tls-acme", "true"),
    ),

    R.when<Ingress, Ingress>(
      () => rules.tlsRedirect === true,
      annotate("ingress.kubernetes.io/force-ssl-redirect", "true"),
    ),
  )(ingress(name, rulesToSpec(rules), toMerge));
