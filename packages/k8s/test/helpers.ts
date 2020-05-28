import { it } from "mocha";
import { diff } from "deep-object-diff";
import { expect } from "chai";
import { resolveContents } from "@fpk/core";

export interface ITestCase<I> {
  it: string;
  in: I;
  fn(input: I): any;
  diff: object;
}

export function runCases(cases: ITestCase<any>[]) {
  cases.forEach((c) => {
    it(c.it, (done) => {
      resolveContents({}, c.in).then((input) => {
        Promise.resolve(c.fn(input))
          .then((out) => {
            const result = diff(input, out);
            expect(result).to.deep.eq(c.diff);
          })
          .then(done)
          .catch(done);
      });
    });
  });
}
