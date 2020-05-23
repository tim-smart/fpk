import { configs$, toFileTree } from "./generate";

configs$(process.argv[2]).subscribe(console.log);
