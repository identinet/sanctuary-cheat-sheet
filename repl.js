#!/usr/bin/env -S deno
import * as sanctuary from "https://cdn.skypack.dev/sanctuary";
import { env as flutureEnv } from "https://cdn.skypack.dev/fluture-sanctuary-types";
export const S = sanctuary.create({
  checkTypes: true,
  env: sanctuary.env.concat(flutureEnv),
});
import * as Fluture from "https://cdn.skypack.dev/fluture";
export const F = Fluture;
