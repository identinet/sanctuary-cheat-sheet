# Sanctuary Cheat Sheet

WARNING: the article is work in progress

The goal of this cheat sheet is to make it easy for newcomers and experienced developers to work with the [Sanctuary library](https://sanctuary.js.org/) by describing common patterns and best practices.

## Function definition

There are two aspects to defining functions:

1. Define the processing steps
2. Define the function signature, including types
3. Define the parameters - one after the other TODO ...

In sanctuary there's a convenient way of defining the processing steps - the `pipe` function. `pipe` takes a list of functions and it passes the output value of one function as the input value into the following function. See [Piping - reduce the number of intermediate variables](#Piping - reduce the number of intermediate variables) for more information:

```javascript
const myfunction = parameter1 => S.pipe([
  doA,
  doB,
  doC,
])(parameter1);
```

For very simple functions defining processing steps might be enough. However, to get all the benefits from sanctuary's type checking functionality the function signature needs to be defined the sanctuary way:

```javascript
const myfunction = TODO
```

## Type definition

## Piping - reduce the number of intermediate variables

Functions often contain a lot of calls to other functions. The intermediate values of the function calls are stored in variables are passed again to other function calls. It might look something like this:

```javascript
const myfunction = parameter1 => parameter2 => parameter3 => {
  const resA = doA(parameter1);
  const resB = doB(parameter2)(resA);
  const resC = doC(parameter3)(resB);
  return resC;
};
```

This could be optimized with the `S.pipe` function by removing the variables and feeding the intermediate results directly into the next function:

```javascript
const myfunction = parameter1 => parameter2 => parameter3 => S.pipe([
  doA,
  doB(parameter2),
  doC(parameter3),
])(parameter1);
```

## Print Debugging - inspecting intermediate values

The goal of print debugging is to peek into a function execution chain and learn about intermediate results.

Example, given the following function - how to inspect the return value of `doA`?

```javascript
const myfunction = S.pipe([
  doA,
  doB,
  doC,
]);
```

Solution, define a `log` function that prints a message and the received value and returns the value. Then add the log function between `doA` and `doB`:

```javascript
const log = msg => value => {
  console.log(msg, value);
  return value;
}

const myfunction = S.pipe([
  doA,
  log("Return value of doA:"),
  doB,
  doC,
]);
```

## Branching - handling if-else cases

In a function there is often the need to handle two cases differently:

```javascript
const myfunction = parameter1 => {
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
const myfunction = parameter1 => S.pipe([
  computeSomething,
  S.ifElse(res => res > 0)(doA)(doB),
])(parameter1);
```

This could get ugly if there are more cases that need to be distinguished, e.g. `res < 0`, `res < 10` and `res >= 10`:

```javascript
const myfunction = parameter1 => S.pipe([
  computeSomething,
  S.ifElse(res => res > 0)(S.ifElse(res => res < 10)(doA)(doC))(doB),
])(parameter1);
```

In this case it might be easier to ...?

## Promises


## Error handling

## When to map or chain?

There are these two different functions, `map` and `chain`, that look very similar. However, using one over the other is sometimes advantageous.

`map` is definied by the [Functor class type](https://github.com/sanctuary-js/sanctuary-type-classes#type-class-hierarchy). Every Functor implements `map`. Functors are often arrays and `map` maps a function over every element of the array. Example, add `1` to every element in an array:

```javascript
const numbers = [1, 2, 3];
const add = number1 => number2 => number1 + number2;
S.map(add(1))(numbers);

// [2, 3, 4]
```

In addition, something like a `Pair` or a `Promise` could also be a Functor. In this case `map` maps over the value, e.g. the result of a `Promise` or the value of a `Pair`.

```javascript
const pair = S.Pair('a')(1);
const add = number1 => number2 => number1 + number2;
S.map(add(1))(pair);

// Pair ("a") (2)
```

As you can see in the example, the `add` doesn't concern itself with the inner workings of the data type but just operates on the value. `map` does the heavy lifting of getting the `Functors` value out and wrapping the modified value back in a `Functor`. This is very convenient because it makes functions easily applicable to all kinds of `Functors`.

However, sometimes this is intelligence of putting the returned value back in a `Functor` works against us. For example, we want to parse an integer from string but only want to return a `Just` value if the integer is greater than 10 otherwise `Nothing`. If we tried to do this with `map` we'd end up with this result:

```javascript
S.pipe([
  S.parseInt(10),
  S.map(S.ifElse(v => v > 10)(S.Just)(v => S.Nothing)),
])('100')

// Just (Just (100))
```

There are now two nested `Just` data types. As you can see from the implementation, the function that's called by `map` already uses the complex data type `Pair` (implemeted by `Just` and `Nothing`). Therefore, if since we pass a `Pair` into the function and the function returns a `Pair`, we don't need `map`'s feature of wrapping the returned value in the passed in `Functor`. `chain` as defined by the Chain class type does exactly that, it expects the function to properly wrap the return value in the `Functor`. This is important when working with `Promises` to ensure that we're not wrapping an unresolved `Promise` inside a resolved `Promise` but return the unresolved `Promise` so we can wait upon its completion:

```javascript
S.pipe([
  S.parseInt(10),
  S.chain(S.ifElse(v => v > 10)(S.Just)(v => S.Nothing)),
])('100')

// Just (100)
```

## join

## filter

## or reduce

## key-value - Pair

## Other great resources

- [Prof. Frisby's Mostly Adequate Guide to Functional Programming](https://github.com/MostlyAdequate/mostly-adequate-guide)
- EggHead, ...
- https://github.com/fantasyland/fantasy-land
- https://github.com/sanctuary-js/sanctuary-type-classes