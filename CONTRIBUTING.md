# Contributing Guide

Thanks for that you are interested in contributing to Farrow.

## Developing

To develop locally:

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
   own GitHub account and then
   [clone](https://help.github.com/articles/cloning-a-repository/) it to your
   local.
2. Create a new branch:

   ```zsh
   git checkout -b MY_BRANCH_NAME
   ```

3. Install pnpm:

   ```zsh
   npm install -g pnpm
   ```

4. Install the dependencies with:

   ```zsh
   pnpm install
   ```

5. Go into package which you want to contribute.

   ```zsh
   cd ./packages/*
   ```

6. Start developing.

## Building

You can build single package, with:

```zsh
cd ./packages/*
pnpm run build
```

build all packages, with:

```zsh
pnpm run build
```

If you need to clean all `node_modules/*` the project for any reason, with

```zsh
pnpm run clean:deps
```

Clean build outputs with

```zsh
pnpm run clean:build
```

Clean all of them

```zsh
pnpm run clean
```

## Testing

You need write th new tests for new feature or modify exist tests for changes.

We wish you write unit tests at `PACKAGE_DIR/__tests__`.

### Run Testing

```sh
pnpm run test
```

## Linting

To check the formatting of your code:

```zsh
pnpm run lint
```

## Formatting

To format your code:

```zsh
pnpm run format
```

## Publishing

We use **pnpm** and **changeset** to manage version and changelog.

Repository maintainers can publish a new version of all packages to npm.

1. Fetch newest code at branch `main`.
2. Install

   ```zsh
   pnpm install
   ```

3. Build

   ```zsh
   pnpm run build
   ```

4. Add changeset

   ```zsh
   pnpm run change
   ```

5. Release

   ```zsh
   pnpm run release
   ```

6. Push commit and tag

   ```zsh
   git push
   git push --tag
   ```
