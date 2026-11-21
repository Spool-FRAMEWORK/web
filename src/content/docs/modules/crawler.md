---
title: crawler
description: Reads a source, splits the data into records and stores each record in the inbox.
sidebar:
  order: 1
---

The crawler reads an external source, splits what it receives into records and stores each record in the inbox as an envelope in the `CAPTURED` state. For each record it publishes `SourcePayloadCaptured` and `EnvelopeStored`.

Artifact: `crawler` 1.2.1, included in the runtime.

## Poll and stream

A crawler has one of two types:

- `POLL` asks the source for data on a schedule. With `scheduleMilliseconds` set to a value greater than zero it repeats at that interval; without it, or with `0`, it reads once.
- `STREAM` receives records as the source pushes them.

The source is a plugin chosen with `source.type`. Spool includes `HTTP` for polling a URL and `IN_MEMORY` for streams created in the same process. You can add your own, as the [BOE example](/examples/) does with `BOE_HTTP`. See [Ports and backends](/ports/).

## From response to records

The crawler turns the response into records in three steps:

1. **Locate.** `rootPath` points to the part of the response that holds the records, with dots between keys and numbers for list positions. For example, `data.items` or `data.sumario.diario.0.items`.
2. **Split.** `mediaType` says how to read that part. `JSON_ARRAY` makes one record per element and `JSON` treats the whole object as one record. `EVENT_CLASS` and `EVENT_CLASS_ARRAY` are for sources that deliver Java objects instead of bytes, such as the in-memory stream: the object is turned into JSON first. `PDF` keeps the document as one record.
3. **Enrich.** Each `enrichment` rule copies a value from anywhere in the response into every record. `source` is the path of the value and `target` the name it gets in the record; without `target`, the name stays the same.

```yaml
source:
  type: HTTP
  configuration:
    sourceId: gazette
    url: "https://example.com/summary"
  rootPath: data.items
  mediaType: JSON_ARRAY
  enrichment:
    - source: data.date
      target: publish_date
```

## Event mapping

`eventMapping` says how to read each record as a Java class:

- `namingConvention` is how the fields are written in the source: `SNAKE_CASE`, `CAMEL_CASE`, `PASCAL_CASE` or `KEBAB_CASE`. It is required.
- `domainMappingList` lists the classes of your records. Each class must be in the `events` package and implement `software.spool.core.model.Event`. When a class is listed, the data lake partition includes `eventType=<class>`.
- `attributeList` names fields of the record that become partition keys in the data lake, as `field=value`. A record without one of those fields cannot be partitioned and fails with a `PartitionKeyException`.

## Errors

By default, an error while reading the source is logged and the crawler tries again on its next run. `errorRouter` lets you choose another router plugin by its `type`, with its own `configuration`. Spool includes `DEFAULT`.

## In the descriptor

```yaml
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
```

The [DSL reference](/dsl/) lists every key.
