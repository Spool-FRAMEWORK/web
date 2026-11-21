---
title: watchdog
description: A separate service that receives heartbeats from every module and reports which ones are degraded.
sidebar:
  order: 6
---

The watchdog is a service of its own, not a library: modules send it a heartbeat, and it keeps track of which ones are alive. It is not part of the runtime, and its repository includes a Dockerfile to run it.

Version: 1.2.0.

## Connecting modules

Modules declared in a descriptor send heartbeats when the `infrastructure` block names the watchdog:

```yaml
infrastructure:
  watchdog: "http://localhost:8090"
```

Modules built in Java use the `watchdog(url, moduleId)` variant of their builder factory.

## Endpoints

| Method and path | What it does |
| --- | --- |
| `POST /heartbeat` | Receives the heartbeat of a module. |
| `GET /health` | Returns the state of every known module. |

## Configuration

The watchdog reads its configuration from environment variables:

| Variable | Meaning | Default |
| --- | --- | --- |
| `WATCHDOG_PORT` | Port of the HTTP server. | 8090 |
| `MODULE_TIMEOUT_SECONDS` | A module without heartbeats for longer than this is marked `DEGRADED`. | 30 |
| `ZOMBIE_TIMEOUT_SECONDS` | A module silent for longer than this is removed from the list. | 300 |
