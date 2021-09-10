#!/usr/bin/env -S deno run --allow-env=NODE_ENV
import sanctuary from "https://cdn.skypack.dev/sanctuary";
import $ from "https://cdn.skypack.dev/sanctuary-def";
import { env as flutureEnv } from "https://cdn.skypack.dev/fluture-sanctuary-types";

export const PromiseType = $.NullaryType("Promise")(
  "https://github.com/identinet/identinet#Promise",
)([])((x) => S.type(x).name === "Promise");

const env = $.env.concat(flutureEnv).concat([PromiseType]);

export const S = sanctuary.create({
  checkTypes:
    (typeof process !== "undefined" && process.env &&
      process.env.NODE_ENV !== "production") ||
    (typeof Deno !== "undefined" && Deno.env.get("NODE_ENV") !== "production"),
  env,
});

export const def = $.create({
  checkTypes:
    (typeof process !== "undefined" && process.env &&
      process.env.NODE_ENV !== "production") ||
    (typeof Deno !== "undefined" && Deno.env.get("NODE_ENV") !== "production"),
  env,
});

// assign all types to S.types, see https://github.com/sanctuary-js/sanctuary/issues/717
S.types = {};
sanctuary.map((t) => (S.types[t.name] = t))(env);

import * as Fluture from "https://cdn.skypack.dev/fluture";
export const F = Fluture;
