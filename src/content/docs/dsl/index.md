---
title: Descriptor reference
description: Every key of the YAML descriptor that declares a Spool node, as read by dsl 1.4.0.
sidebar:
  label: Descriptor reference
  order: 1
---

A descriptor is a YAML file that declares one node: the infrastructure it uses and the modules it runs. The runtime reads it from the classpath:

```java
SpoolRuntime.builder()
        .OpenTelemetryConfiguration(OpenTelemetryConfiguration.builder().serviceName("my-node").build())
        .withNodeFromDSL("/Spool.yaml")
        .build()
        .start();
```

This page describes the format read by `dsl` 1.4.0. Values are taken literally: this version does not replace variables or environment references.

## Structure

```yaml
infrastructure:
  watchdog: "http://localhost:8090"
  eventBus:   { type: ..., configuration: { ... } }
  inbox:      { type: ..., configuration: { ... } }
  dataLake:   { type: ..., configuration: { ... } }

modules:
  - crawler:  { ... }
  - ingester: { ... }
  - janitor:  { ... }
```

Both `infrastructure` and `modules` are required. Each entry of `modules` has exactly one key, which names the module type. Module and plugin names are not case sensitive.

## infrastructure

| Key | Required | Meaning |
| --- | --- | --- |
| `watchdog` | No | URL of the [watchdog](/modules/watchdog/). When it is set, every module sends heartbeats to it. |
| `eventBus` | When a module needs it | The event bus. |
| `inbox` | When a module needs it | The inbox. |
| `dataLake` | When a module needs it | The data lake. |

Each component has a `type`, which names the plugin, and an optional `configuration` with the plugin's settings. The available types and their settings are in [Ports and backends](/ports/).

A component is only required by the modules that use it:

| Module | Uses |
| --- | --- |
| crawler | `eventBus`, `inbox` |
| ingester | `eventBus`, `inbox`, `dataLake` |
| janitor | `eventBus`, `inbox` |

## crawler

| Key | Required | Meaning |
| --- | --- | --- |
| `type` | Yes | `POLL` or `STREAM`. |
| `id` | Yes | Name of the module, used in logs, metrics and heartbeats. |
| `source` | Yes | Where the data comes from. See below. |
| `eventMapping` | Yes | How each record is read. See below. |
| `errorRouter` | No | Plugin that handles errors, with `type` and `configuration`. The default is `DEFAULT`. |

### source

| Key | Required | Meaning |
| --- | --- | --- |
| `type` | Yes | Source plugin, for example `HTTP`. |
| `configuration` | Depends on the plugin | Settings of the plugin. For `HTTP`: `url` and `sourceId`. |
| `configuration.scheduleMilliseconds` | No | For `POLL` crawlers, time between reads. Missing or `0` means read once. |
| `mediaType` | Yes | How the response is split into records: `JSON`, `JSON_ARRAY`, `EVENT_CLASS`, `EVENT_CLASS_ARRAY` or `PDF`. |
| `rootPath` | No | Path to the part of the response that holds the records, such as `data.items`. |
| `enrichment` | No | List of rules that copy a value from the response into every record. Each rule has `source`, the path of the value, and optionally `target`, its name in the record. |

### eventMapping

| Key | Required | Meaning |
| --- | --- | --- |
| `namingConvention` | Yes | How field names are written in the source: `SNAKE_CASE`, `CAMEL_CASE`, `PASCAL_CASE` or `KEBAB_CASE`. |
| `domainMappingList` | No | Names of the record classes, which must be in the `events` package. |
| `attributeList` | No | Fields of the record used as partition keys in the data lake. |

Both lists accept plain names or objects with a `value` key:

```yaml
domainMappingList:
  - Order
  - value: Refund
```

## ingester

| Key | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Name of the module. |
| `type` | No | `REACTIVE` writes each record as it arrives; `FLUSH` writes in batches. The default is `REACTIVE`. |
| `configuration.size` | No | For `FLUSH`, number of records per batch. The default is 100. |
| `configuration.milliseconds` | No | For `FLUSH`, maximum time a record waits in the batch. |

## janitor

| Key | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Name of the module. |
| `configuration.milliseconds` | No | Time between runs. The default is 5000. |
| `configuration.millisecondsThreshold` | No | How long an envelope can stay in `CAPTURED` before it is published again. The default is 3 minutes. |
| `configuration.millisecondsTTL` | No | How long a `PERSISTED` envelope stays in the inbox. The default is 1 day. |

## Complete example

```yaml title="src/main/resources/Spool.yaml"
infrastructure:
  watchdog: "http://localhost:8090"

  eventBus:
    type: KAFKA
    configuration:
      bootstrap.servers: "localhost:9092"

  inbox:
    type: FILE_SYSTEM
    configuration:
      path: "/var/spool/inbox"

  dataLake:
    type: FILE_SYSTEM
    configuration:
      path: "/var/spool/datalake"

modules:
  - crawler:
      type: POLL
      id: orders-crawler
      source:
        type: HTTP
        configuration:
          sourceId: orders-api
          url: "https://orders.example.com/api/orders"
          scheduleMilliseconds: 60000
        mediaType: JSON_ARRAY
        rootPath: data.orders
        enrichment:
          - source: data.exported_at
            target: exported_at
      eventMapping:
        namingConvention: SNAKE_CASE
        domainMappingList:
          - Order
        attributeList:
          - currency

  - ingester:
      id: orders-ingester
      type: FLUSH
      configuration:
        size: 500
        milliseconds: 10000

  - janitor:
      id: orders-janitor
      configuration:
        milliseconds: 5000
        millisecondsThreshold: 60000
        millisecondsTTL: 86400000
```

## Errors

A descriptor that cannot be read stops `build()`. The message names the key with its full path and says what was expected, for example:

```
Invalid descriptor /Spool.yaml: modules[0].crawler.source is required
```

An unknown module or plugin type lists the ones that are available.
