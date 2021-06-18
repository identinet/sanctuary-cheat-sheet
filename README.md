# Sanctuary Cheat Sheet

WARNING: the article is work in progress

The goal of this cheat sheet is to make it easy for newcomers and experienced developers to work with the [Sanctuary library](https://sanctuary.js.org/) by describing common patterns and best practices.

[toc]

## Function definition

There are three aspects to defining functions:

1. Define the parameters - one after the other
1. Define the processing steps
1. Define the function signature types

In functional programming functions are usually curried. This means that a function only takes one parameter. If a function requires more than one parameter it should be defined as a function that takes one parameter and returns a functional that requires another parameter.

Fortunately, JavaScript's arrow functions make it really easy to create curried functions:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) => {
  // the function body
};
```

In sanctuary there's a convenient way of defining the processing steps - the `pipe` function. `pipe` takes a list of functions and it passes the output value of one function as the input value into the following function. See [Piping - reduce the number of intermediate variables](#Piping - reduce the number of intermediate variables) for more information:

```javascript
const myfunction = (parameter1) => S.pipe([doA, doB, doC])(parameter1);
```

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
const Integer = $.NullaryType("Integer")(
  // name
  "http://example.com/my-package#Integer"
)(
  // documentation URL
  []
)(
  // supertypes
  (x) =>
    typeof x === "number" && // predicate values need to satisfy
    Math.floor(x) === x &&
    x >= Number.MIN_SAFE_INTEGER &&
    x <= Number.MAX_SAFE_INTEGER
);
```

## Piping - connecting function output to function input and avoid intermediate variables

Functions often contain a lot of calls to other functions. The intermediate values of the function calls are stored in variables are passed again to other function calls. It might look something like this:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) => {
  const resA = doA(parameter1);
  const resB = doB(parameter2)(resA);
  const resC = doC(parameter3)(resB);
  return resC;
};
```

This could be optimized with the `S.pipe` function by removing the variables and feeding the intermediate results directly into the next function:

```javascript
const myfunction = (parameter1) => (parameter2) => (parameter3) =>
  S.pipe([doA, doB(parameter2), doC(parameter3)])(parameter1);
```

## Print Debugging - inspecting intermediate values

The goal of print debugging is to peek into a function execution chain and learn about intermediate results.

Example, given the following function - how to inspect the return value of `doA`?

```javascript
const myfunction = S.pipe([doA, doB, doC]);
```

Solution, define a `log` function that prints a message and the received value and returns the value. Then add the log function between `doA` and `doB`:

```javascript
const log = (msg) => (value) => {
  console.log(msg, value);
  return value;
};

const myfunction = S.pipe([doA, log("Return value of doA:"), doB, doC]);
```

## Branching - handling if-else cases

In a function there is often the need to handle two cases differently:

```javascript
const myfunction = (parameter1) => {
  const res = computeSomething(parameter1);
  if (res > 0) {
    return doA(res);
  } else {
    return doB(res);
  }
};
```

In sanctuary it could be done as follows:

```javascript
const myfunction = (parameter1) =>
  S.pipe([computeSomething, S.ifElse((res) => res > 0)(doA)(doB)])(parameter1);
```

This could get ugly if there are more cases that need to be distinguished, e.g. `res < 0`, `res < 10` and `res >= 10`:

```javascript
const myfunction = (parameter1) =>
  S.pipe([
    computeSomething,
    S.ifElse((res) => res > 0)(S.ifElse((res) => res < 10)(doA)(doC))(doB),
  ])(parameter1);
```

In this case it might be easier to ...?

## Promises

## Error handling

## When to map or chain?

There are these two different functions, `map` and `chain`, that look very similar. However, using one over the other is sometimes advantageous.

`map` is defined by the [Functor class type](https://github.com/sanctuary-js/sanctuary-type-classes#type-class-hierarchy). Every Functor implements `map`. Functors are often arrays and `map` maps a function over every element of the array. Example, add `1` to every element in an array:

```javascript
const numbers = [1, 2, 3];
const add = (number1) => (number2) => number1 + number2;
S.map(add(1))(numbers);

// [2, 3, 4]
```

In addition, something like a `Pair` or a `Promise` could also be a Functor. In this case `map` maps over the value, e.g. the result of a `Promise` or the value of a `Pair`.

```javascript
const pair = S.Pair("a")(1);
const add = (number1) => (number2) => number1 + number2;
S.map(add(1))(pair);

// Pair ("a") (2)
```

As you can see in the example, the `add` doesn't concern itself with the inner workings of the data type but just operates on the value. `map` does the heavy lifting of getting the `Functors` value out and wrapping the modified value back in a `Functor`. This is very convenient because it makes functions easily applicable to all kinds of `Functors`.

However, sometimes this is intelligence of putting the returned value back in a `Functor` works against us. For example, we want to parse an integer from string but only want to return a `Just` value if the integer is greater than 10 otherwise `Nothing`. If we tried to do this with `map` we'd end up with this result:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
])("100");

// Just (Just (100))
```

There are now two nested `Just` data types. As you can see from the implementation, the function that's called by `map` already uses the complex data type `Pair` (implemented by `Just` and `Nothing`). Therefore, if since we pass a `Pair` into the function and the function returns a `Pair`, we don't need `map`'s feature of wrapping the returned value in the passed in `Functor`. `chain` as defined by the Chain class type does exactly that, it expects the function to properly wrap the return value in the `Functor`. This is important when working with `Promises` to ensure that we're not wrapping an unresolved `Promise` inside a resolved `Promise` but return the unresolved `Promise` so we can wait upon its completion:

```javascript
S.pipe([
  S.parseInt(10),
  S.chain(S.ifElse((v) => v > 10)(S.Just)((v) => S.Nothing)),
])("100");

// Just (100)
```

## join

## filter

## or reduce

## key-value - Pair

## Other great resources

- Sanctuary library introduction: [Sanctuary, Programming Safely in an Uncertain World](https://www.youtube.com/watch?v=a2astdDbOjk)
- Introduction to functional programming: [Things I wish someone had explained about Functional Programming](https://jrsinclair.com/articles/2019/what-i-wish-someone-had-explained-about-functional-programming/)
- Functional programming video tutorial series: [Professor Frisby Introduces Composable Functional JavaScript](https://egghead.io/lessons/javascript-you-ve-been-using-monads)
- Functional programming book: [Prof. Frisby's Mostly Adequate Guide to Functional Programming](https://github.com/MostlyAdequate/mostly-adequate-guide)
- Functional programming book: [Composing Software](https://medium.com/javascript-scene/composing-software-the-book-f31c77fc3ddc)
- Fantasy Land Spec walkthrough: [Fantas, Eel, and Specification](http://www.tomharding.me/fantasy-land/)
- Sanctuary type class overview: [Sanctuary Type Classes](https://github.com/sanctuary-js/sanctuary-type-classes) and [Fantasy Land Specification](https://github.com/fantasyland/fantasy-land)
- Sanctuary type overview: [sanctuary-def](https://github.com/sanctuary-js/sanctuary-def)
