---
title: Build your first pipeline
description: Run a node that reads orders from an HTTP endpoint and writes them to a data lake on disk.
sidebar:
  order: 2
---

This guide builds a node that reads a list of orders from an HTTP endpoint, stores each order in an inbox and writes it to a data lake on the file system. Everything runs in one process on your machine, with no other service.

You need a Maven project with the runtime, as described in [Install Spool](/getting-started/).

## 1. Serve some data

The crawler needs a source to read. Save this file as `orders.json`:

```json title="orders.json"
[
  { "order_id": "A-1001", "customer": "ACME", "amount": 120.50, "currency": "EUR" },
  { "order_id": "A-1002", "customer": "Globex", "amount": 75.00, "currency": "EUR" },
  { "order_id": "A-1003", "customer": "Initech", "amount": 310.20, "currency": "EUR" }
]
```

Serve it on port 8000 from the folder that contains it. Any HTTP server that returns a JSON array works; this one comes with Python:

```sh
python -m http.server 8000
```

## 2. Describe the node

A node is described in a YAML file that the runtime reads from the classpath. Create `src/main/resources/Spool.yaml`:

```yaml title="src/main/resources/Spool.yaml"
infrastructure:
  eventBus:
    type: IN_MEMORY

  inbox:
    type: FILE_SYSTEM
    configuration:
      path: "spool-data/inbox"

  dataLake:
    type: FILE_SYSTEM
    configuration:
      path: "spool-data/datalake"

modules:
  - crawler:
      type: POLL
      id: orders-crawler
      source:
        type: HTTP
        configuration:
          sourceId: orders-api
          url: "http://localhost:8000/orders.json"
          scheduleMilliseconds: 60000
        mediaType: JSON_ARRAY
      eventMapping:
        namingConvention: SNAKE_CASE

  - ingester:
      id: orders-ingester
      type: REACTIVE

  - janitor:
      id: orders-janitor
      configuration:
        milliseconds: 5000
        millisecondsThreshold: 10000
        millisecondsTTL: 60000
```

The `infrastructure` block declares what the modules share. The event bus lives in memory, which is enough when every module runs in the same process. The inbox and the data lake are folders, relative to the directory where you start the program.

The three modules do the work:

- The **crawler** asks the URL for data once a minute (`scheduleMilliseconds`). Because the response is a JSON array, it splits it into one record per element. `sourceId` names the source, and that name ends up in the data lake path.
- The **ingester** writes each record to the data lake as soon as the crawler has stored it.
- The **janitor** checks the inbox every 5 seconds. It records which envelopes are already in the data lake, publishes again the ones that have waited longer than `millisecondsThreshold`, and deletes from the inbox the ones that have been in the data lake for longer than `millisecondsTTL`.

The [DSL reference](/dsl/) lists every key.

## 3. Start the node

Create the entry point of the program:

```java title="src/main/java/com/example/Main.java"
package com.example;

import software.spool.runtime.OpenTelemetryConfiguration;
import software.spool.runtime.SpoolRuntime;

public class Main {
    public static void main(String[] args) {
        SpoolRuntime.builder()
                .OpenTelemetryConfiguration(OpenTelemetryConfiguration.builder()
                        .serviceName("first-pipeline")
                        .build())
                .withNodeFromDSL("/Spool.yaml")
                .build()
                .start();
    }
}
```

The OpenTelemetry configuration is required. With only a service name, the node tries to send its telemetry to a collector on the default local address and logs `Failed to export` when there is none. Those messages do not affect the pipeline; [Operations](/operations/) explains how to point it at a real collector.

Run `Main` from your IDE or with Maven. The node keeps running until you stop it.

## 4. Check the result

After a few seconds, the working directory contains this:

```
spool-data/
├── inbox/
│   └── PERSISTED/
│       ├── ca769770….json
│       ├── cb5ca79e….json
│       └── d0beb143….json
└── datalake/
    └── bronze/year=2026/month=11/day=21/hour=20/source=orders-api/
        ├── ca769770….json
        ├── cb5ca79e….json
        └── d0beb143….json
```

Each file is an envelope: one order, wrapped with the information Spool needs to trace it. The file name is its idempotency key, a SHA-256 of the source and the content, so the same order read twice is stored once.

```json
{
  "idempotencyKey": { "value": "ca76977059863551b1096539f28eb289f5e59899cfac8ba4843ea1155ac55771" },
  "metadata": {
    "metadata": {
      "SOURCE": "orders-api",
      "CORRELATION_ID": "97d873eb-82d9-465f-a2c1-47faee9620fe",
      "PARTITION_SCHEMA": "{\"sourceId\":\"orders-api\",\"eventType\":\"java.lang.Void\",\"attributes\":[]}"
    }
  },
  "mediaType": { "value": "JSON_ARRAY" },
  "payload": "eyJvcmRlcl9pZCI6IkEtMTAwMyIsImN1c3RvbWVyIjoiSW5pdGVjaCIsImFtb3VudCI6MzEwLjIsImN1cnJlbmN5IjoiRVVSIn0=",
  "status": "CAPTURED",
  "retries": 0,
  "capturedAt": 1795292136.6882117,
  "updatedAt": null
}
```

The payload is the original order encoded in Base64:

```json
{"order_id":"A-1003","customer":"Initech","amount":310.2,"currency":"EUR"}
```

The inbox keeps one folder per state. An envelope starts in `CAPTURED` and moves to `PERSISTED` on the next run of the janitor after the ingester has written it. The data lake partitions records by the hour they were captured and by source. [Envelope lifecycle](/concepts/envelope-lifecycle/) explains each state.

The node also answers on port 8080 with the health of its modules:

```sh
curl http://localhost:8080/spool/health
```

## Next steps

- [How Spool works](/concepts/) explains the modules and the events between them.
- [SEC EDGAR filings](/examples/sec-edgar/) shows a pipeline over real public data, with a source written for it.
