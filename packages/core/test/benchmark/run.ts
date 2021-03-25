import { generate } from "../../src/index";
import * as Path from "path";

const src = Path.join(__dirname, "src");
const compiled = Path.join(__dirname, "compiled");

generate(src, compiled);
