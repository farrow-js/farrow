# Benchmark

Using [Clinic](https://clinicjs.org/) and [autocannon](https://github.com/mcollina/autocannon).

## build

```bash
pnpm run build
```

## benchmark

```bash
pnpm run benchmark
```

Get the performance data, like `Req/sec`.

```bash
clinic flame --on-port 'autocannon -c 100 -d 30 -p 10 localhost:$PORT' -- node ./dist/simple/index.js
```

## doctor

Get all analysis data.

```bash
pnpm run doctor
```

## flame

Get flamegraph.

```bash
pnpm run flame
```
