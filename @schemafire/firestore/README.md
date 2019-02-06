# @schemafire/firestore

`@schemafire/firestore` is an object modeling tool built with TypeScript to help manage your Firestore data in a **_scalable_** way.

You define your Types using [`io-ts`](https://github.com/gcanti/io-ts/blob/master/README.md) and this design allows for code reuse across multiple environments.

<br>

## Getting Started

_Be sure you have installed [firebase-admin](https://github.com/firebase/firebase-admin-node) and [optionally][@google-cloud/firestore](https://www.npmjs.com/package/@google-cloud/firestore)._

```bash
# Install peer dependencies
yarn add firebase-admin io-ts

# Install the package
yarn add @schemafire/firestore
```

This library provides first-class TypeScript (TS) support from defining your data models, through to consuming them. To capture this intent I've written the rest of this guide using TS.

Add these settings to your `tsconfig.json`.

```json5
{
  compilerOptions: {
    //...
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
  },
}
```

Without this, you would need to write `import * as adminWhat from 'firebase-admin'`, which isn't quite as pleasant.

So with that we're all set to dive in.

The first code we need to write initializes `firebase-admin` in our project. Further guidance is available from the official `firebase-admin` [docs](https://firebase.google.com/docs/admin/setup#initialize_the_sdk).

```ts
import admin from 'firebase-admin';

const serviceAccount = require('path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<DATABASE_NAME>.firebaseio.com',
});
```

Yes!

If we'd tried to use `@schemafire/firestore` before, it would have blown up in our faces, so... we dodged a bullet there.

<br>

The foundation of `@schemafire/firestore`, is the **codec type** from [`io-ts`](https://github.com/gcanti/io-ts) which accomplishes _a few of my favorite things_ 🎶

- Runtime type checks
- Automatic schema validation
- Lightweight enough to be used throughout the whole development stack (for those as hipster and suave as yours truly)

So, in summary, [`io-ts`](https://github.com/gcanti/io-ts) changes lives.

_Cough_\* let's create our codec.

```ts
/* codec.ts */

import * as t from 'io-ts';
import { utils, string, number } from '@schemafire/firestore';

export const userCodec = t.type({
  username: strings.username,
  email: utils.nullable(strings.email),
  ticket: utils.optional(t.string),
});
```

Look at that! We've just defined the shape of data for every user, and we get to use this same shape throughout our code base. We call these little bundles of joy, **codecs**. You can call them whatever you like.

- `t.type` is from [`io-ts`](https://github.com/gcanti/io-ts) and defines the shape.
- `utils.nullable(strings.email)` is from the `@schemafire/core` library and lets the runtime know that this an email which is also nullable.

There are several other utilities hidden within `@schemafire/core`. Perhaps you could [help](https://github.com/ifiokjr/schemafire/blob/CONTRIBUTING.md) in ensuring their dark secrets are brought to the light.

<br>

Continuing, a [`Schema`](https://github.com/ifiokjr/schemafire/blob/@schemafire/firestore/src/schema.ts) enables us to apply codecs to our database models. Let's write code to pull in the class and experience the magic.

```ts
/* user.ts */

import { Schema } from '@schemafire/firestore';
import { userCodec } from './codec';

const UserSchema = new Schema({
  // The codec (io-ts type) we defined earlier
  codec: userCodec,

  // The name of the firestore collection this refers to
  collection: 'users',

  // The default data for a user (should match the shape of the codec)
  defaultData: { username: '', email: null, ticket: undefined },

  // Instance methods are available on each instance of the model.
  instanceMethods: {
    assignWinningLotteryTicket: (model /* A model instance */, deps /* injected dependencies */) => async (
      winningTicket: string /* value method is called with */,
    ) => {
      model.data.ticket = winningTicket; // updates the instance value
      await model.run(); // Assigns the win to this user.
    },
  },

  // Static methods will be available on the schema instance.
  staticMethods: {
    createLosingTickerUser: (ctx /* The schema */) => ({ username, email }) => {
      // Something fun
      return ctx.create({ username, email, ticket: 'loser123' });
    },
  },
});
```

Here's what this code has accomplished

- We've got a schema with three properties defined by the codec.
- We've attached it to our `user` firestore collection
- It has one instance method and one static method.

The next step is to build a model from this. We'll start with our first user to sign up, **Kemi**.

```ts
const kemi = UserSchema.create({ username: 'kemi_the_great' email: 'kemi@greatness.com'});

console.log(kemi.data);
// => { username: kemi_the_great, email: 'kemi@greatness.com', schemaVersion: 0, createdAt: FirestoreTimestamp, updatedAt: FirestoreTimestamp }
```

Yay! We've just created a model based on the schema we defined earlier. Models wrap our firebase data providing:

- strong typing
- instance methods
- automated behavior

And it's all defined by the Schema. While it is possible to create Models directly via instantiation `model = new Model({...})` we _almost_ always want to create our models through the Schema.

<br>

It turns out that our algorithm likes Kemi. It thinks she has a great name. It wants her to **win our lottery**.

Let's make it happen using an _**instance method**_.

```ts
import { getFixedLotteryResults } from 'some-dark-web-hole';

getFixedLotteryResults().then(winningTicket => {
  await kemi.methods.assignWinningLotteryTicket(winningTicket);
});
```

Remember how we defined the instance method `assignWinningLotteryTicket` earlier on in our schema, well we've just put it good use with Kemi. She's now a winner.

We define instance methods as a function that returns a function. The outer function receives two parameters, the model instance and the injected dependencies object while the inner function receives whatever we think it should.

```ts
// Instance Method type signature
type InstanceMethod = (model: Model, deps: Dependencies) => (...args: any[]) => any;
```

The instance method we created was defined as:

```ts
const assignWinningLotteryTicket = (model: Model, deps: Dependencies) => async (winningTicket: string) => {
  model.data.ticket = winningTicket; // updates the instance value
  return model.run(); // Assigns the win to this user and returns the output of run
};
```

Instance methods typically return promises, although they don't have to (they can return anything you wish). Another thing to note is that in the interest of high-quality types, instance methods **must** be defined at instantiation of the schema and can't be added afterward.

<br>

Here are some other great things Kemi can do.

```ts
// Kemi changed her email
kemi.update({ email: 'i_won@rolling.com' }); // Can be used to update multiple properties in one run.
// or
kemi.data.email = 'i_won@rolling.com'; // whichever you prefer

// Delete a property
kemi.delete(['email']);
// or
delete kemi.email;

// Attach a callback (for when data is next pulled into the model);
kemi.attach(({ model, data }) => model.update({ username: 'so_rich' }));
```

For all our bravado and joy, we still haven't saved anything to Firebase. No way!

The methods `update`, `delete`, `callback` don't do anything on their own. I guess you could call them lazy. Each method adds an action to the queue for the instance of the model (`kemi`), and these actions are only executed when we call the `run` method.

```ts
kemi.run({ forceGet: true }).then(model => console.log(model.data));
// {...data, updatedAt: `NewTimeStamp` }
```

Wait a second! Where did `createdAt` come from? We didn't add that! Well spotted, eagle-eyed learner.

In @schemafire every model is automatically augmented with three fields:

- `createdAt` - When the document was created
- `updatedAt` - When the document was last updated
- `schemaVersion` - The version of the document being used (in preparation for migrations support 🎉)

These injected fields help us sort and manage the versions of our data.

Notice as well that `forceGet` is used. This option forces the model to pull fresh data after all updates are run to ensure the model has the latest document. This is a useful option when we need access to up to date information like `updatedAt` timestamp.

`run` also takes the following configuration options.

```ts
interface RunConfig {
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

<br>

Fast forward several months and Kemi is growing accustomed to this new found wealth. Unfortunately, the news of her riches has drawn in unwanted attention, to the point that she's taken to hiding, all while growing disgusted by her overnight fame. Fueled by a desire for privacy she pens a heartfelt goodbye, and requests we delete her account.

😢

We'll miss you Kemi.

Thankfully we can also delete data from our firestore collection.

```ts
kemi
  .delete() // Notice the empty params which tells the model to delete EVERYTHING on the next run
  .run()
  .then(() => console.log("...And, it's gone."));
```

Easy enough.

<br>

However, Kemi's fame has not gone unnoticed. Several others believe they are in with a chance of winning and decide to sign up for accounts.

Including Bob.

Bob is a character. Bob signs up.

Bob is **really** a character. So for some reason, our entirely mathematical and unbiased _algorithm_ doesn't take too kindly to him.

Good old Bob.

```ts
const bob = UserSchema.methods.createLosingTickerUser({
  username: 'bob',
  email: 'bob@hopeful.com',
});
```

This uses the static method that we defined when instantiating our schema.

Static methods are similar to instance methods except that:

- They are called on the Schema instance rather than the model instance
- They don't allow for dependency injection currently

```ts
// Instance Method type signature
type StaticMethod = (ctx: Schema) => (...args: any[]) => any;
```

<br>

**Great work!** You've just completed an introduction into `@schemafire/firestore`. There's already a lot more functionality than what's been discussed, and I'll be adding more docs as I build this, hopefully useful, library.

<br>

## Work in progress

Remember this is still very much a work in progress. I'm building it for use in several projects, and the API is likely to change over the next few months.

You can follow this issue for a [**road to beta release breakdown**](https://github.com/ifiokjr/schemafire/issues/4).
