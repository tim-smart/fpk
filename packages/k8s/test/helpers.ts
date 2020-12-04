import { it } from "mocha";
import { diff } from "deep-object-diff";
import { expect } from "chai";
import { resolveContents } from "@fpk/core";

export interface ITestCase<I> {
  it: string;
  in: I;
  fn(input: I): any;
  diff: any;
}

export function runCases(cases: ITestCase<any>[]) {
  cases.forEach((c) => {
    it(c.it, (done) => {
      resolveContents({}, c.in).then((input) => {
        Promise.resolve(c.fn(input))
          .then((out) => {
            if (Array.isArray(out)) {
              expect(out).to.deep.eq(c.diff);
            } else {
              const result = diff(input, out);
              expect(result).to.deep.eq(c.diff);
            }
          })
          .then(done)
          .catch(done);
      });
    });
  });
}
