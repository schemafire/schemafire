# @skeema/firestore

`@skeema/firestore` is an object modelling tool built with TypeScript to help manage your firestore data in a **_scalable_** way.

Types are defined via [`io-ts`](https://github.com/gcanti/io-ts/blob/master/README.md) and this design allows them to be reused across multiple environments.

<br>

## Getting Started

_First, be sure you have installed [firebase-admin](https://github.com/firebase/firebase-admin-node) and [optionally][@google-cloud/firestore](https://www.npmjs.com/package/@google-cloud/firestore)._

```bash
# Install peer dependencies
yarn add firebase-admin io-ts
```

Now install `@skeema/firestore` and `@skeema/core`:

```bash
yarn add @skeema/firestore @skeema/core
```

One key goal of this project is to provide first-class TypeScript support when defining your data models. As a result, the rest of this guide is written using TypeScript.

To follow along with these examples using TypeScript, add these settings to your `tsconfig.json`.

```json5
{
  compilerOptions: {
    //...
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
  },
}
```

Without this you'll need to use `import * as blah from 'blim'`, which is further away from the esnext syntax we've all grown to love.

Okay. We're all set to rock this. Let's rock it.

The first thing we need to do is include `firebase-admin` in our project and initialize the library. Further guidance is available from the official `firebase-admin` [docs](https://firebase.google.com/docs/admin/setup#initialize_the_sdk).

```ts
import admin from 'firebase-admin';

const serviceAccount = require('path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<DATABASE_NAME>.firebaseio.com',
});
```

Boom!

If we'd tried to use `@skeema/firestore` before, it would have blown up in our faces. All the way up in that beautiful face. So... we definitely dodged a bullet there.

Speaking of blowing up, we're going to build a lottery schema so foolish it could possibly mark the end of my fledgling career as developer.

You have been warned. Proceed with caution.

The foundation of `@skeema/firestore`, is the **definition type** which accomplishes _a few of my favourite things_ 🎶

- Runtime type checks
- Automatic schema validation
- Lightweight enough to be used throughout the whole development stack (for those as hipster and suave as yours truly)

So, in summary, [io-ts](https://github.com/gcanti/io-ts) changes lives.

_Cough_\* let's create our definition.

```ts
/* definitions.ts */
import * as t from 'io-ts';
import { utils, string, number } from '@skeema/core';

export const userDefinition = t.type({
  username: strings.username,
  email: utils.nullable(strings.email),
  ticket: utils.optional(t.string),
});
```

Look at that! We've just defined the shape of data for every user and this same shape can be used throughout our code base. I call these little bundles of code, **definitions**. You can call them whatever you like.

- `t.type` is from [`io-ts`](https://github.com/gcanti/io-ts) and defines the shape.
- `utils.nullable(strings.email)` is from the `@skeema/core` library and lets the runtime know that this an email which is also nullable

There are several other utilities hidden within `@skeema/core`. Perhaps you could [help](https://github.com/ifiokjr/skeema/blob/CONTRIBUTING.md) in ensuring their dark secrets are brought into the light.

[Schema's](https://github.com/ifiokjr/skeema/blob/@skeema/firestore/src/schema.ts) allow us to apply definitions to our database models. Let's pull in this class and start writing some world changing code.

```ts
/* user.ts */

import { Schema } from '@skeema/firestore';
import { userDefinition } from './definitions';

const UserSchema = new Schema({
  // The definition (io-ts type) we defined earlier
  definition: userDefinition,
  // The name of the firestore collection this refers to
  collection: 'users',
  // The default data for a user (should match the shape of the definition)
  defaultData: { username: '', email: null, ticket: undefined },
  instanceMethods: {
    assignWinningLotteryTicket: (
      model /* A model instance */,
      deps /* injected dependencies */,
    ) => async (winningTicket: string /* value method is called with */) => {
      model.data.ticket = winningTicket; // updates the instance value
      await model.run(); // Assigns the win to this user.
    },
  },
  staticMethods: {
    createLosingTickerUser: (ctx /* The schema */) => ({ username, email }) => {
      // Something fun
      return ctx.create({ username, email, ticket: 'loser123' });
    },
  },
});
```

So far so good. We've got a schema with three properties defined by the definition. It is attached to our firestore collection `users` and has one instance method and one static method.

The next step is to build a model from this.

```ts
const kemi = UserSchema.create({ username: 'kemi_the_great' email: 'kemi@greatness.com'});

console.log(kemi.data);
// { username: kemi_the_great, email: 'kemi@greatness.com', schemaVersion: 0, createdAt: FirestoreTimestamp, updatedAt: FirestoreTimestamp }
```

Yay! We've just created a model based on the schema we defined. Models provide us with data, instanceMethods and behaviour as defined by the Schema. We almost always want to create our models with Schema rather than directly (although the latter is possible).

Anyway it turns out that our algorithm likes Kemi. It thinks she has a great name. It wants her to win.

Let's make it happen, with **instanceMethods**.

```ts
import { getFixedLotteryResults } from 'some-dark-web-hole';

getFixedLotteryResults().then(winningTicket => {
  await kemi.methods.assignWinningLotteryTicket(winningTicket);
});
```

Remember how we defined that instanceMethod earlier on in our schema, well we've just put it good use with Kemi. She's now a winner.

Instance methods typically return promises, although they don't have to (they can return anything you wish). Another thing to note is that in the interest of high quality Types, instance methods **must** be defined at instantiation of the schema and can't be added afterwards.

Here are some other great things Kemi can do.

```ts
// Kemi changed her email
kemi.update({ email: 'iwon@rolling.com' }); // Can be used to update multiple properties in one run.
// or
kemi.data.email = 'iwon@rolling.com'; // whichever you prefer

// Delete a property
kemi.delete(['email']);
// or
delete kemi.email;

// Attach a callback (for when data is next pulled into the model);
kemi.attach(({ model, data }) => model.update({ username: 'so_rich' }));
```

But we still haven't saved anything to Firebase. Shock! Horror! Each method adds an action to the queue for the model, and these actions are run when we call the `run` method.

```ts
kemi.run({ forceGet: true }).then(model => console.log(model.data));
// {...data, updatedAt: `NewTimeStamp` }
```

Notice that `forceGet` is used, which forces the model to perform pull fresh data after all updates are run to ensure the model has the latest document. `run` also takes the following configuration options.

```ts
export interface RunConfig {
  /**
   * Should data be mirrored for this run
   * @default true
   */
  mirror?: boolean;
  /**
   * Whether to run the actions inside a transaction
   * @default true
   */
  useTransactions?: boolean;
  /**
   * Number of attempts the transaction should take before failing
   */
  maxAttempts?: number;
  /**
   * Whether we want to get the latest data after an Create or Update action.
   * This can be useful when creating data for the first time and we want to view the ServerTimestamp.
   */
  forceGet?: boolean;
}
```

As Kemi gets used to her new found wealth, she realises she no longer wants to use our app and requests we delete her account.

No problem whatsoever.

```ts
kemi
  .delete() // Notice the empty params which tells the model to delete EVERYTHING on the next run
  .run()
  .then(() => console.log("...And, it's gone."));
```

But Kemi's fame has not gone un-noticed. Several others believe they are in with a chance of winning and decide to sign up for accounts.

Including Bob.

Bob is a character. Bob signs up, but for some reason, our completely mathematical and unbiased _algorithm_ doesn't take too kindly to him.

```ts
const bob = UserSchema.methods.createLosingTickerUser({
  username: 'bob',
  email: 'bob@hopeful.com',
});
```

This uses the static method that we defined when instantiating our schema.

Okay.

### Congratulations

That's a decent introduction into `@skeema/firestore`. There's already a lot more functionality than what's been discussed and I'll be adding more docs as I build this concurrently with my other projects.

<br>

## Work in progress

Remember this is still very much a work in progress. I'm building it for use in several projects and the API is likely to change over the next few months.

Below are some of the things that

### Coming soon

- [x] Create schema using using [`io-ts`](https://github.com/gcanti/io-ts/blob/master/README.md) definitions.
- [x] Add instance methods and static methods to help manage data in the models.
- [x] All updates are automatically wrapped in transactions
- [x] Create getting started guide.
- [ ] Support data validation with io-ts
- [ ] Allow config option for automated data validation
- [ ] Enable option for non transactional updates
- [ ] Validation support
- [ ] Perform queries on multiple items of data ⬆
- [ ] Add support for [references](https://stackoverflow.com/a/47673346)
- [ ] Define an api and add support for data population and

### Coming later

- [ ] Support data migrations
- [ ] Supported for mass data migrations from CLI
- [ ] Fake data creation
- [ ] Improved test coverage
- [ ] Model relationships

### Coming much later

- [ ] Solve world hunger
- [ ] Learn Objective-C
- [ ] Complete Witcher 3
