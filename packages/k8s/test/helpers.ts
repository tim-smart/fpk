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
    it(c.it, () => {
      const out = c.fn(c.in);
      const result = diff(c.in, out);
      expect(result).to.deep.eq(c.diff);
    });
  });
}
