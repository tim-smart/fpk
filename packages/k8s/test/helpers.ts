import { it } from "mocha";
import { diff } from "deep-object-diff";
import { expect } from "chai";

export interface ITestCase<I> {
  it: string;
  in: I;
  fn(input: I): any;
  diff: object;
}

export function runCases(cases: ITestCase<any>[]) {
  cases.forEach((c) => {
    it(c.it, (done) => {
      Promise.resolve(c.fn(c.in))
        .then((out) => {
          const result = diff(c.in, out);
          expect(result).to.deep.eq(c.diff);
        })
        .then(done)
        .catch(done);
    });
  });
}
