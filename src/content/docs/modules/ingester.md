---
title: ingester
description: Validates each captured record and writes it to the data lake.
sidebar:
  order: 2
---

The ingester listens for `EnvelopeStored`, reads the envelope from the inbox and runs the [validation rules](/modules/validator/) for its source. It writes the valid records to the data lake and publishes `EnvelopePersisted` for each one. Records that break a rule are not written.

Artifact: `ingester` 1.2.0, included in the runtime.

## Reactive or in batches

| `type` | Behaviour |
| --- | --- |
| `REACTIVE` | Writes each record as soon as it arrives. This is the default. |
| `FLUSH` | Keeps the records in a buffer and writes them together when the buffer reaches `size` records, or every `milliseconds` if that comes first. Without `size`, the buffer holds 100 records. |

```yaml
- ingester:
    id: orders-ingester
    type: FLUSH
    configuration:
      size: 500
      milliseconds: 10000
```

## Data lake layout

The ingester writes to the `bronze` layer of the data lake, one file per record, under a path built from the capture time, the source and, when the crawler maps records to a class, the event type:

```
bronze/year=2026/month=11/day=21/hour=20/source=orders-api/<idempotency key>.json
```

Partition attributes declared in the crawler's `eventMapping.attributeList` are added to the path.

## Quarantine

When a record breaks a rule, the ingester sends the original data and the list of violations to its quarantine store and publishes `EnvelopeQuarantined`. The store is the `QuarantineStore` port, which you provide when you build the ingester in Java with `quarantineStore(...)`.

A node built from a descriptor has no quarantine store in this version. In that case the record is not written to the data lake, stays `CAPTURED` in the inbox, and the ingester logs a `NullPointerException` from the quarantine step.
