# Sanctuary Cheat Sheet

WARNING: the article is work in progress

The goal of this cheat sheet is to make it easy for newcomers and experienced developers to work with the [Sanctuary library](https://sanctuary.js.org/) by describing common patterns and best practices.

[toc]

## Function definition

There are three aspects to defining functions:

1. Define the parameters - one after the other
1. Define the processing steps
1. Define the function signature with types

### Define the parameters

In functional programming functions are usually curried. This means that a function only takes one parameter. If a function requires more than one parameter it should be defined as a function that takes one parameter and returns a functional that requires another parameter.

Fortunately, JavaScript's arrow functions make it really easy to create curried functions:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) => {
  // the function body
};
```

### Define the processing steps

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

### Define the function signature with types

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

## Type definition

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
  const resD = doD(resC);
  const resE = doE(resD);
  const resF = doF(resE);
  const resG = doG(resF);
  const resH = doH(resG);
  const resI = doI(resH);
  const resJ = doJ(resI);
  return resC;
};
```

This could be optimized with the [`pipe`][pipe] function by removing the variables and feeding the intermediate results directly into the next function:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) =>
  S.pipe([
    doA,
    doB(parameter2),
    doC(parameter3),
    doD,
    doE,
    doF,
    doG,
    doH,
    doI,
    doJ,
  ])(parameter1);
```

## Print debugging - inspecting intermediate values

The goal of print debugging is to peek into a function execution chain and learn about intermediate results.

Example, given the following function - how to inspect the return value of `do3`?

```javascript
const myfunction = S.pipe([
  do1,
  do2,
  do3,
  do4,
  do5,
  do6,
  do7,
  do8,
  do9,
  do10,
  do11,
]);
```

Solution, define a `log` function that prints a message and the received value and returns the value. Then add the `log` function between `do3` and `do4`:

```javascript
const log = (msg) => (value) => {
  console.log(msg, value);
  return value;
};

const myfunction = S.pipe([
  do1,
  do2,
  do3,
  log("Return value of do3:"),
  do4,
  do5,
  do6,
  do7,
  do8,
  do9,
  do10,
  do11,
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

In [Sanctuary](https://sanctuary.js.org/) it could be done as follows:

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

## Promises

[Sanctuary](https://sanctuary.js.org/) doesn't provide special handling for [`Promises`][promise]. However, since they're used all over the place in JavaScript it would be great to deal with them in a functional way. There's a functional [`Promises`][promise] library for this: [Fluture](https://github.com/fluture-js/Fluture)

### Integration with Sanctuary

Here's the official [Fluture sanctuary integration](https://github.com/fluture-js/Fluture#sanctuary). The important lines are:

```javascript
import sanctuary from "sanctuary";
import { env as flutureEnv } from "fluture-sanctuary-types";
const S = sanctuary.create({
  checkTypes: true,
  env: sanctuary.env.concat(flutureEnv),
});
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

### Call a promise-returning function

There are two main helper functions by Fluture to deal with [`Promises`][promise]: [`attemptP`][attpemtp] and [`encaseP`][encasep].

[`attemptP`][attpemtp] takes a function that doesn't take a parameter and turns it into a [`Future`][future], e.g.:

```javascript
attemptP(() => Promise.resolve(42));
```

[`encaseP`][encasep] takes a function that takes one parameter and turns it into a [`Future`][future], e.g.:

```javascript
encaseP(fetch)("https://api.github.com/users/Avaq");
```

### Processing Futures

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

### Lists of Futures

- parallel

## Error handling

- Maybe
- Either
- bimap

## map or chain?

There are these two different functions, [`map`][map] and [`chain`][chain], that look very similar. However, using one over the other is sometimes advantageous.

### map

[`map`][map] is defined by the [`Functor` class type](https://github.com/sanctuary-js/sanctuary-type-classes#type-class-hierarchy). Every [`Functor`][functor] implements [`map`][map]. [`Functors`][functor] are often arrays and [`map`][map] maps a function over every element of the array. Example, add `1` to every element in an array of numbers:

```javascript
const numbers = [1, 2, 3];
const add = (number1) => (number2) => number1 + number2;
S.map(add(1))(numbers);

// [2, 3, 4]
```

In addition, something like a [`Pair`][pair] or a [`Promise`][promise] could also be a [`Functor`][functor]. In this case [`map`][map] maps over the value, e.g. the result of a [`Promise`][promise] or the value of a [`Pair`][pair].

```javascript
const pair = S.Pair("a")(1);
const add = (number1) => (number2) => number1 + number2;
S.map(add(1))(pair);

// Pair ("a") (2)
```

As you can see in the example, the `add` doesn't concern itself with the inner workings of the data type but just operates on the value. [`map`][map] does the heavy lifting of getting the [`Functors`][functor] value out and wrapping the modified value back in a [`Functor`][functor]. This is very convenient because it makes functions easily applicable to all kinds of [`Functors`][functor].

### chain

However, sometimes this is intelligence of putting the returned value back in a [`Functor`][functor] works against us. For example, we want to parse an integer from string but only want to return a [`Just`][just] value if the integer is greater than 10 otherwise [`Nothing`][nothing]. If we tried to do this with [`map`][map] we'd end up with this result:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
])("100");

// Just (Just (100))
```

There are now two nested [`Just`][just] data types. As you can see from the implementation, the function that's called by [`map`][map]already uses the complex data type [`Pair`][pair] (implemented by [`Just`][just] and [`Nothing`][nothing]). Therefore, if since we pass a [`Pair`][pair] into the function and the function returns a [`Pair`][pair], we don't need[`map`][map]'s feature of wrapping the returned value in the passed in [`Functor`][functor]. [`chain`][chain] as defined by the Chain class type does exactly that, it expects the function to properly wrap the return value in the [`Functor`][functor]. This is important when working with [`Promises`][promise] to ensure that we're not wrapping an unresolved [`Promise`][promise] inside a resolved [`Promise`][promise] but return the unresolved [`Promise`][promise] so we can wait upon its completion:

```javascript
S.pipe([
  S.parseInt(10),
  S.chain(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
])("100");

// Just (100)
```

### join

If you receive a value that's wrapped twice in the same type we can use [`join`][join] to remove one layer of wrapping:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
  S.join, // added join
])("100");

// Just (100)
```

Note that the added [`join`][join] plays nicely in case [`Nothing`][nothing] is returned by [`parseInt`][parseint]:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
  S.join, // added join
])("invalid100");

// Nothing
```

## filter

## or reduce

## key-value - Pair

## Libraries

- Sanctuary - Refuge from unsafe JavaScript: [Sanctuary](https://sanctuary.js.org/)
- Sanctuary type class overview: [Sanctuary Type Classes](https://github.com/sanctuary-js/sanctuary-type-classes) and [Fantasy Land Specification](https://github.com/fantasyland/fantasy-land)
- Sanctuary type overview: [sanctuary-def](https://github.com/sanctuary-js/sanctuary-def)
- Fluture - Fantasy Land compliant (monadic) alternative to Promises: [Fluture](https://github.com/fluture-js/Fluture)

## Other great resources

- Sanctuary library introduction: [Sanctuary, Programming Safely in an Uncertain World](https://www.youtube.com/watch?v=a2astdDbOjk)
- Introduction to functional programming: [Things I wish someone had explained about Functional Programming](https://jrsinclair.com/articles/2019/what-i-wish-someone-had-explained-about-functional-programming/)
- Fantasy Land Spec walkthrough: [Fantas, Eel, and Specification](http://www.tomharding.me/fantasy-land/)
- Functional programming video tutorial series: [Professor Frisby Introduces Composable Functional JavaScript](https://egghead.io/lessons/javascript-you-ve-been-using-monads)
- Functional programming book: [Prof. Frisby's Mostly Adequate Guide to Functional Programming](https://github.com/MostlyAdequate/mostly-adequate-guide)
- Functional programming book: [Composing Software](https://medium.com/javascript-scene/composing-software-the-book-f31c77fc3ddc)

[attemptp]: https://github.com/fluture-js/Fluture#attemptp
[chain]: https://sanctuary.js.org/#chain
[encasep]: https://github.com/fluture-js/Fluture#encaseP
[filter]: https://sanctuary.js.org/#filter
[fork]: https://github.com/fluture-js/Fluture#fork
[functor]: https://github.com/sanctuary-js/sanctuary-type-classes#type-class-hierarchy
[future]: https://github.com/fluture-js/Fluture#future
[join]: https://sanctuary.js.org/#join
[just]: https://sanctuary.js.org/#Just
[map]: https://sanctuary.js.org/#map
[nothing]: https://sanctuary.js.org/#Nothing
[pair]: https://sanctuary.js.org/#section:pair
[parseint]: https://sanctuary.js.org/#parseInt
[pipe]: https://sanctuary.js.org/#pipe
[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[reduce]: https://sanctuary.js.org/#reduce
