![Work in Progress](https://img.shields.io/badge/WIP-Work%20in%20Progress-yellow)

# Sanctuary Cheat Sheet

The goal of this cheat sheet is to make it easy for newcomers and experienced developers to work with the [Sanctuary library][sanctuary] by describing common patterns and best practices.

WARNING: the information in this cheat sheet is by no means a comprehensive collection of all the library functions and types. Nor are the examples the only or even the best way of how to use them in your code. Keep this in mind and also dive into [other resouces](#resources---additional-things-that-might-be-helpful). I highly recommend reading [Things I wish someone had explained about Functional Programming](https://jrsinclair.com/articles/2019/what-i-wish-someone-had-explained-about-functional-programming/) and the [Fantas, Eel, and Specification](http://www.tomharding.me/fantasy-land/).

<!-- Table of Contents generated with: https://github.com/ycd/toc -->
<!--toc-->

- [Sanctuary Cheat Sheet](#sanctuary-cheat-sheet)
  - [Function definition](#function-definition)
    - [Define parameters](#define-parameters)
    - [Define processing steps](#define-processing-steps)
    - [Define function signature with types](#define-function-signature-with-types)
  - [Type definition - create your own functional types](#type-definition---create-your-own-functional-types)
  - [Piping - connecting function outputs to function inputs and avoid intermediate variables](#piping---connecting-function-outputs-to-function-inputs-and-avoid-intermediate-variables)
  - [Print debugging - inspecting intermediate values](#print-debugging---inspecting-intermediate-values)
  - [Branching - handling if-else cases](#branching---handling-if-else-cases)
  - [Promises - back to the Future](#promises---back-to-the-future)
    - [Integration with Sanctuary](#integration-with-sanctuary)
    - [Basic setup](#basic-setup)
    - [Promises - working with Promise-returning functions](#promises---working-with-promise-returning-functions)
    - [Processing - the Future is yet to come](#processing---the-future-is-yet-to-come)
    - [Parallel Futures](#parallel-futures)
    - [Stopping the Future](#stopping-the-future)
  - [map or chain?](#map-or-chain)
    - [map - transform a list of values](#map---transform-a-list-of-values)
    - [chain - perform type-aware transformation of values](#chain---perform-type-aware-transformation-of-values)
    - [join - combine multiple objects of the same type](#join---combine-multiple-objects-of-the-same-type)
  - [filter - remove unneeded values](#filter---remove-unneeded-values)
  - [reduce - accumulate values](#reduce---accumulate-values)
  - [Error handling](#error-handling)
    - [Maybe - the better null/NaN/undefined return value](#maybe---the-better-nullnanundefined-return-value)
    - [Either - the better alternative to throw Error](#either---the-better-alternative-to-throw-error)
    - [bimap - mapping over two values (potential failure)](#bimap---mapping-over-two-values-potential-failure)
  - [Pair - storing key-value pairs](#pair---storing-key-value-pairs)
  - [Read-Eval-Print-Loop - try out Sanctuary](#read-eval-print-loop---try-out-sanctuary)
    - [Web](#web)
    - [Local browser or deno](#local-browser-or-deno)
  - [Libraries - little helpers](#libraries---little-helpers)
  - [Resources - additional things that might be helpful](#resources---additional-things-that-might-be-helpful)

<!-- tocstop -->

## Function definition

There are three aspects to defining functions:

1. Define the parameters - one after the other
1. Define the processing steps
1. Define the function signature with types

### Define parameters

In functional programming functions are usually curried. This means that a function only takes one parameter. If a function requires more than one parameter it should be defined as a function that takes one parameter and returns a functional that requires another parameter.

Fortunately, JavaScript's arrow functions make it really easy to create curried functions:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) => {
  // the function body
};
```

### Define processing steps

In sanctuary there's a convenient way of defining the processing steps - the [`pipe`][pipe] function. [`pipe`][pipe] takes a list of functions and it passes the output value of one function as the input value into the following function. See [Piping](#piping---connecting-function-outputs-to-function-inputs-and-avoid-intermediate-variables) for more information:

```javascript
const myfunction = (parameter1) =>
  S.pipe([
    // first processing step
    doA,
    // second procesing step
    doB,
    // ...
    doC,
  ])(parameter1);
```

### Define function signature with types

For very simple functions defining processing steps might be enough. However, to get all the benefits from sanctuary's type checking functionality the function signature needs to be defined the sanctuary way. Take a look at the [built-in types](https://github.com/sanctuary-js/sanctuary-def#types):

```javascript
// define a def function that makes it easy to create functions with
type checks
const $ = require("sanctuary-def");
const def = $.create({
  checkTypes: process.env.NODE_ENV === "development",
  env,
});

//    add :: Number -> Number -> Number
const add =
def ('add')                           // name
    ({})                              // type-class constraints
    ([$.Number, $.Number, $.Number])  // input and output types
    (x => y => x + y);                // implementation
```

TODO daggy

## Type definition - create your own functional types

The types that can be used by functions need to be first defined. Sanctuary has a number of constructors for defining types. Take a look at sanctuary's [Type constructors](https://github.com/sanctuary-js/sanctuary-def#type-constructors). Here is a very simple one that defines an integer. Keep in mind that a documentation URL is required where more information can be found about the type - the project's `REAMDE.md` is a good place to keep the type definition documentation at:

```javascript
const Integer = $.NullaryType(
  // name
  "Integer"
)(
  // documentation URL
  "http://example.com/my-package#Integer"
)(
  // supertypes
  []
)(
  // predicate values need to satisfy
  (x) =>
    typeof x === "number" &&
    Math.floor(x) === x &&
    x >= Number.MIN_SAFE_INTEGER &&
    x <= Number.MAX_SAFE_INTEGER
);
```

## Piping - connecting function outputs to function inputs and avoid intermediate variables

Functions often contain a lot of calls to other functions. The intermediate values of the function calls are stored in variables are passed again to other function calls. It might look something like this:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) => {
  const resA = doA(parameter1);
  const resB = doB(parameter2)(resA);
  const resC = doC(parameter3)(resB);
  return resC;
};
```

This could be optimized with the [`pipe`][pipe] function by removing the variables and feeding the intermediate results directly into the next function:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) =>
  S.pipe([
    doA,
    // output of doA is piped as input into doB
    doB(parameter2),
    doC(parameter3),
  ])(parameter1);
```

## Print debugging - inspecting intermediate values

The goal of print debugging is to peek into a function execution chain and learn about intermediate results.

Example, given the following function - how to inspect the return value of `doA`?

```javascript
const myfunction = S.pipe([
  // some function calls
  doA,
  doB,
  doC,
]);
```

Solution, define a `log` function that prints a message and the received value and returns the value. Then add the `log` function between `doA` and `doB`:

```javascript
const log = (msg) => (value) => {
  console.log(msg, value);
  return value;
};

const myfunction = S.pipe([
  doA,
  // insert log function
  log("Return value of do3:"),
  doB,
  doC,
]);
```

## Branching - handling if-else cases

In a function there is often the need to handle two cases differently:

```javascript
const myfunction = (parameter1) => {
  const res = computeSomething(parameter1);
  if (res > 0) {
    doA(res);
  } else {
    doB(res);
  }
  // further processing
};
```

In [Sanctuary][sanctuary] it could be done with the [`ifElse`][ifelse] function as follows:

```javascript
const myfunction = (parameter1) =>
  S.pipe([
    computeSomething,
    S.ifElse((res) => res > 0)(doA)(doB),
    // further processing
  ])(parameter1);
```

This could get ugly if there are more cases that need to be distinguished, e.g. `res < 0`, `res < 10` and `res >= 10`:

```javascript
const myfunction = (parameter1) =>
  S.pipe([
    computeSomething,
    S.ifElse((res) => res < 0)(doB)(S.ifElse((res) => res < 10)(doA))(doC),
  ])(parameter1);
```

In this case it might be easier to TODO ...?

## Promises - back to the Future

[Sanctuary][sanctuary] doesn't provide special handling for [`Promises`][promise]. However, since they're used all over the place in JavaScript it would be great to deal with them in a functional way. There's a functional [`Promises`][promise] library for this: [Fluture](https://github.com/fluture-js/Fluture)

### Integration with Sanctuary

Here's the official [Fluture sanctuary integration](https://github.com/fluture-js/Fluture#sanctuary). The important lines are:

```javascript
import sanctuary from "sanctuary";
import { env as flutureEnv } from "fluture-sanctuary-types";
const S = sanctuary.create({
  checkTypes: true,
  env: sanctuary.env.concat(flutureEnv),
});
import { fork, encaseP, attemptP, parallel } from "Fluture";
```

### Basic setup

The [`fork`][fork] call needs to be present in the program and there should be ideally _only one_ fork call. [`fork`][fork] processes the [`Promise`][promise]. Without [`fork`][fork] no processing of [`Futures`][future] takes place.

```javascript
fork(
  // error case
  log("rejection")
)(
  // resolution case
  log("resolution")
)(attemptP(() => Promise.resolve(42)));
```

### Promises - working with Promise-returning functions

There are two main helper functions by Fluture to deal with [`Promises`][promise]: [`attemptP`][attemptp] and [`encaseP`][encasep].

[`attemptP`][attemptp] takes a function that doesn't take a parameter and turns it into a [`Future`][future], e.g.:

```javascript
attemptP(() => Promise.resolve(42));
```

[`encaseP`][encasep] takes a function that takes one parameter and turns it into a [`Future`][future], e.g.:

```javascript
encaseP(fetch)("https://api.github.com/users/Avaq");
```

### Processing - the Future is yet to come

The main question is how do we deal with Futures in [`pipe`][pipe]. There are two important cases to keep in mind: [map or chain?](#map-or-chain). Either we process the Future with [`map`][map] (2) - in this case no knowledge about the Future is required by the function that receives the value - or with [`map`][map] (3) - in this case the Future is consumed and a new future needs to be returned by the function.

If we forget to use [`map`][map] or [`map`][map] in a function call (1), the function receives the unfinished Future. It's like acting on a [`Promise`][promise] without calling `.then()` or `await` on it.

```javascript
const myfunction = S.pipe([
  encaseP(fetch),
  log("Try to log the output of fetch:"), // 1
  S.map(log("Log the output of fetch:")), // 2
  S.map(extractURL),
  S.chain(encaseP(fetch)), // 3
]);

fork(log("rejection"))(log("resolution"))(
  myfunction("https://api.github.com/users/Avaq")
);
```

### Parallel Futures

It's also possible to process multiple [`Futures`][future] in a functional way. For example, multiple long-running computations should to be performed. [`parallel`][parallel] provides this functionality and controls the number of parallel executions with the first parameter:

```javascript
const myLongRunningFunction = (x) => {
  // computation take 1 sec
  return new Promise((resolve, reject) => setTimeout(resolve, 1000, x * 2));
};

fork(log("rejection"))(log("resolution"))(
  S.pipe([
    // 5 Futures are created
    S.map(encaseP(myLongRunningFunction)),
    // 2 Futures are processed in parallel until all are resolved
    parallel(2),
  ])([1, 2, 3, 4, 5])
);
```

### Stopping the Future

Unlike [`Promises`][promise], [`Futures`][future] don't execute the contained function unless [`fork`][fork] is called on it. This makes it possible to stop a [`Future`][future] or to never execute it if not needed. The functionality is described in detail in the [Cancellation documentation][cancellation].

## map or chain?

There are these two different functions, [`map`][map] and [`chain`][chain], that look very similar. However, using one over the other is sometimes advantageous.

### map - transform a list of values

[`map`][map] is defined by the [`Functor` class type][functor]. Every [`Functor`][functor] implements [`map`][map]. [`Functors`][functor] are often arrays and [`map`][map] maps a function over every element of the array. Example, add `1` to every element in an array of numbers:

```javascript
const numbers = [1, 2, 3];
const add = (number1) => (number2) => number1 + number2;
S.map(add(1))(numbers);

// result: [2, 3, 4]
```

In addition, something like a [`Pair`][pair] or a [`Promise`][promise] could also be a [`Functor`][functor]. In this case [`map`][map] maps over the value, e.g. the result of a [`Promise`][promise] or the value of a [`Pair`][pair].

```javascript
const pair = S.Pair("a")(1);
const add = (number1) => (number2) => number1 + number2;
S.map(add(1))(pair);

// result: Pair ("a") (2)
```

As you can see in the example, the `add` doesn't concern itself with the inner workings of the data type but just operates on the value. [`map`][map] does the heavy lifting of getting the [`Functors`][functor] value out and wrapping the modified value back in a [`Functor`][functor]. This is very convenient because it makes functions easily applicable to all kinds of [`Functors`][functor].

### chain - perform type-aware transformation of values

However, sometimes this is intelligence of putting the returned value back in a [`Functor`][functor] works against us. For example, we want to parse an integer from string but only want to return a [`Just`][just] value if the integer is greater than 10 otherwise [`Nothing`][nothing]. If we tried to do this with [`map`][map] we'd end up with this result:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
])("100");

// result: Just (Just (100))
```

There are now two nested [`Just`][just] data types. As you can see from the implementation, the function that's called by [`map`][map]already uses the complex data type [`Pair`][pair] (implemented by [`Just`][just] and [`Nothing`][nothing]). Therefore, if since we pass a [`Pair`][pair] into the function and the function returns a [`Pair`][pair], we don't need[`map`][map]'s feature of wrapping the returned value in the passed in [`Functor`][functor]. [`chain`][chain] as defined by the Chain class type does exactly that, it expects the function to properly wrap the return value in the [`Functor`][functor]. This is important when working with [`Promises`][promise] to ensure that we're not wrapping an unresolved [`Promise`][promise] inside a resolved [`Promise`][promise] but return the unresolved [`Promise`][promise] so we can wait for its completion:

```javascript
S.pipe([
  S.parseInt(10),
  S.chain(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
])("100");

// result: Just (100)
```

### join - combine multiple objects of the same type

If you receive a value that's wrapped twice in the same type we can use [`join`][join] to remove one layer of wrapping:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
  S.join, // added join
])("100");

// result: Just (100)
```

Note that the added [`join`][join] plays nicely in case [`Nothing`][nothing] is returned by [`parseInt`][parseint]:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
  S.join, // added join
])("invalid100");

// result: Nothing
```

## filter - remove unneeded values

When composing function calls with [`pipe`][pipe] it's common that arrays of values are processed. [`map`][map] is great for transforming array elements with the help of other functions. However, sometimes the list of array elements needs to be reduced before processing them further. For example, `null` values or [`Nothing`][nothing] values need to be removed or numbers that are lower than a certain threshold. This can be easily done with [`filter`][filter] that takes a predicate / filter function:

```javascript
S.filter(
  // predicate function that's applied to input values
  (x) => x > 3
)(
  // the input values
  [1, 2, 3, 4, 5]
);

// [ 4, 5 ]
```

## reduce - accumulate values

In the same way as [`filter`][filter], [`reduce`][reduce] operates on an array of values and transforms + collects them into an accumulated/reduced new value. This concept of reducing values is so powerful that [`map`][map] and [`filter`][filter] can be expressed with [`reduce`][reduce]. However, expressing [`map`][map] or [`filter`][filter] via [`reduce`][reduce] is more difficult to read than using the predefined functions. Therefore, we'll stick to simple reduction feature here. For example, the values of an array could be summed up with [`reduce`][reduce]:

```javascript
S.reduce(
  // function that performs the accumulation / reduction of values
  (acc) => (x) => acc + x
)(
  // start value for acc
  0
)(
  // the input values
  [1, 2, 3, 4, 5]
);

// result: 15
```

## Error handling

When processing data sometimes the data doesn't conform to the requirements and an error is raised. In [Sanctuary][sanctuary] there are multiple ways of handling errors, a few of them are explored here:

### Maybe - the better null/NaN/undefined return value

A function might not be able to operate on all possible input values. For example, the [`parseInt`][parseint] function takes a string and tries to parse an integer from it. When it fails to parse the string the function could return [`null`][null], [`undefined`][undefined] or [`NaN`][nan] but this leaves lots of room for interpretation as it's not clear whether the function was able to process the input properly.

Instead, a [`Maybe`][maybe] type could be returned that wraps the actual result in either a [`Just`][just] or a [`Nothing`][nothing] object. When wrapping the return value in a [`Maybe`][maybe] object further processing steps graciously deal with the result. For example, [`map`][map] only executes the transformation function when a [`Just`][just] object is returned:

```javascript
const myParseInt = (str) => {
  const res = parseInt(str);
  if (isNaN(res)) {
    return S.Nothing;
  }
  return S.Just(res);
};

S.show(
  S.map(
    S.pipe([
      // call to function that produces a Maybe result object
      myParseInt,
      // further processing
      S.map((x) => x + 10),
    ])
  )(["1", "invalid1"])
);

// result: [Just (11), Nothing]
```

Additional [functions][maybe] exist for handling [`Maybe`][maybe] objects.

### Either - the better alternative to throw Error

Another programming challenge is to deal with errors, for example when an attempted division by zero. Instead of [`throwing`][throw] an [`Error`][error], [Sanctuary][sanctuary] offers the [`Either`][either] type that can be a [`Right`][right] object that includes the successful result or a [`Left`][left] object that includes the error.

[`Either`][either] is different from [`Maybe`][maybe] in that [`Left`][left] contains additional data for processing and potentially recovering from the error while [`Nothing`][nothing] contains no data.

```javascript
const myDiv = (num) => (divider) => {
  if (divider === 0) {
    return S.Left("Division by zero.");
  }
  return S.Right(num / divider);
};

S.show(
  S.map(
    S.pipe([
      // call to function that produces an Either result object
      myDiv(25),
      // further processing
      S.map((x) => x + 10),
    ])
  )([5, 0])
);

// result: [Right (15), Left ("Division by zero.")]
```

Additional [functions][either] exist for handling [`Either`][either] objects.

### bimap - mapping over two values (potential failure)

When there are multiple subtypes to deal with like [`Left`][left] and [`Right`][right] it would be handy to be able to map over both options. [`bimap`][bimap] provides this feature so we can begin handling the failure:

```javascript
const myDiv = (num) => (divider) => {
  if (divider === 0) {
    return S.Left("Division by zero.");
  }
  return S.Right(num / divider);
};

S.show(
  S.map(
    S.pipe([
      // call to function that produces an Either result object
      myDiv(25),
      // further processing
      S.bimap(S.toUpper)((x) => x + 10),
    ])
  )([5, 0])
);

// result: [Right (15), Left ("DIVISION BY ZERO.")]
```

[`mapLeft`][mapleft] is another option for just interacting with the error case. For [`Futures`][future], [`coalesce`][coalesce] and [`mapRej`][maprej] are the respective functions for dealing with rejected values.

## Pair - storing key-value pairs

[Sanctuary][sanctuary] provides the type [`Pair`][pair] for storing key-value pairs. Compared to a simple JavaScript [`Object`][object] (`{}`), [`Pair`][pair] plays nicely with other functions, e.g. [`map`][map] and [`mapLeft`][mapleft]:

```javascipt
const p = S.Pair('balance')(1)

S.show(S.map(x => x * 2)(p))
// result: Pair ("balance") (2)

S.show(S.mapLeft(x => "accountnumber")(p))
// result: Pair ("accountnumber") (1)
```

## Read-Eval-Print-Loop - try out Sanctuary

### Web

A web-based [Sanctuary][sanctuary]-only REPL is available [online](https://sanctuary.js.org/#section:overview), start typing in the <span style="color: green;">green</span> box.

### Local browser or deno

To quickly get a local [Sanctuary][sanctuary] REPL, open the developer tools in your browser (keyboard shortcut `Ctrl-Shift-i`) or install [Deno](https://deno.land/) and run this command:

For [Deno](https://deno.land/) there's unfortunately no faster option yet, see [[Feature Request] CLI option for REPL imports](https://github.com/denoland/deno/issues/7425).

```bash
deno relp --eval 'import {S, F} from "https://deno.land/x/sanctuary_cheat_sheet/repl.js"'
```

#### Older deno <= 1.11.2 version

```bash
deno
```

Then paste these instructions in the REPL to import [Sanctuary][sanctuary] and [Fluture](https://github.com/fluture-js/Fluture):

```javascipt
// Sanctuary only:
let S; import("https://cdn.skypack.dev/sanctuary").then(l => { S=l.default; });

// Fluture + Sanctuary integration:
import("https://cdn.skypack.dev/fluture-sanctuary-types").then(l => { S = S.create({checkTypes: true, env: S.env.concat(l.env)}); });
let F; import("https://cdn.skypack.dev/fluture").then(l => { F=l; });
```

## Libraries - little helpers

- Sanctuary - Refuge from unsafe JavaScript: [Sanctuary][sanctuary]
- Sanctuary type class overview: [Sanctuary Type Classes](https://github.com/sanctuary-js/sanctuary-type-classes) and [Fantasy Land Specification](https://github.com/fantasyland/fantasy-land)
- Sanctuary type overview: [sanctuary-def](https://github.com/sanctuary-js/sanctuary-def)
- Fluture - Fantasy Land compliant (monadic) alternative to Promises: [Fluture](https://github.com/fluture-js/Fluture)
- Most - Monadic stream for reactive programming: [Most](https://github.com/cujojs/most)

## Resources - additional things that might be helpful

- Sanctuary library introduction: [Sanctuary, Programming Safely in an Uncertain World](https://www.youtube.com/watch?v=a2astdDbOjk)
- Introduction to functional programming: [Things I wish someone had explained about Functional Programming](https://jrsinclair.com/articles/2019/what-i-wish-someone-had-explained-about-functional-programming/)
- Fantasy Land Spec walkthrough: [Fantas, Eel, and Specification](http://www.tomharding.me/fantasy-land/)
- Functional programming video tutorial series: [Professor Frisby Introduces Composable Functional JavaScript](https://egghead.io/lessons/javascript-you-ve-been-using-monads)
- Functional programming book: [Prof. Frisby's Mostly Adequate Guide to Functional Programming](https://github.com/MostlyAdequate/mostly-adequate-guide)
- Functional programming book: [Composing Software](https://medium.com/javascript-scene/composing-software-the-book-f31c77fc3ddc)
- Functional programming book: [Functional-Light JavaScript](https://github.com/getify/functional-light-js)

[attemptp]: https://github.com/fluture-js/Fluture#attemptp
[bimap]: https://sanctuary.js.org/#bimap
[cancellation]: https://github.com/fluture-js/Fluture#cancellation
[chain]: https://sanctuary.js.org/#chain
[coalesce]: https://github.com/fluture-js/Fluture#coalesce
[either]: https://sanctuary.js.org/#Either
[encasep]: https://github.com/fluture-js/Fluture#encaseP
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[filter]: https://sanctuary.js.org/#filter
[fork]: https://github.com/fluture-js/Fluture#fork
[functor]: https://github.com/sanctuary-js/sanctuary-type-classes#type-class-hierarchy
[future]: https://github.com/fluture-js/Fluture#future
[ifelse]: https://sanctuary.js.org/#ifElse
[join]: https://sanctuary.js.org/#join
[just]: https://sanctuary.js.org/#Just
[left]: https://sanctuary.js.org/#Left
[maprej]: https://github.com/fluture-js/Fluture#mapRej
[map]: https://sanctuary.js.org/#map
[mapleft]: https://sanctuary.js.org/#mapLeft
[maybe]: https://sanctuary.js.org/#Maybe
[nan]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN
[nothing]: https://sanctuary.js.org/#Nothing
[null]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null
[pair]: https://sanctuary.js.org/#section:pair
[parallel]: https://github.com/fluture-js/Fluture#parallel
[parseint]: https://sanctuary.js.org/#parseInt
[pipe]: https://sanctuary.js.org/#pipe
[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[reduce]: https://sanctuary.js.org/#reduce
[right]: https://sanctuary.js.org/#Right
[sanctuary]: https://sanctuary.js.org/
[throw]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw
[undefined]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
