#!/usr/bin/env -S deno
import sanctuary from "https://cdn.skypack.dev/sanctuary";
import def from "https://cdn.skypack.dev/sanctuary-def";
import { env as flutureEnv } from "https://cdn.skypack.dev/fluture-sanctuary-types";
export const $ = def;
export const S = sanctuary.create({
  checkTypes: true,
  env: $.env.concat(flutureEnv),
});
import * as Fluture from "https://cdn.skypack.dev/fluture";
export const F = Fluture;
