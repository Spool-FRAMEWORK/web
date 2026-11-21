---
title: How Spool works
description: Nodes, modules, events and the path a record follows from the source to the data mart.
sidebar:
  label: How Spool works
  order: 1
---

Spool takes data from external sources to a data mart in separate steps. Each step is a module, and modules never call each other. One publishes an event when it finishes its work, and the next one reacts to it. That is what makes every record traceable, and what lets the same pipeline run in one process or across several machines.

## Nodes and modules

A node is a Java process that runs one or more modules. You describe it in a [descriptor](/dsl/) or build it in code, and start it with `SpoolRuntime`.

| Module | What it does |
| --- | --- |
| crawler | Reads a source, splits the data into records and stores each one in the inbox. |
| ingester | Validates each record and writes it to the data lake. |
| janitor | Keeps the state of the inbox up to date, publishes again what got stuck and deletes what is no longer needed. |
| mounter | Reads closed partitions of the data lake and writes aggregated results to a data mart. |
| watchdog | A separate service that receives a heartbeat from every module and reports which ones are degraded. |

The crawler, the ingester and the janitor can be declared in a descriptor. The mounter is built in Java.

## Shared infrastructure

Modules share three pieces of infrastructure, each one behind a port with interchangeable [backends](/ports/).

- The **event bus** carries the events between modules. With the in-memory bus all modules must run in the same node. With Kafka they can run in different ones.
- The **inbox** holds each captured record, wrapped in an envelope, until it is safely in the data lake.
- The **data lake** stores the records, partitioned by capture time and source.

## The path of a record

1. The crawler reads the source and splits the response into records. It wraps each record in an envelope, stores it in the inbox with the state `CAPTURED` and publishes `EnvelopeStored`.
2. The ingester receives `EnvelopeStored`, reads the envelope from the inbox and runs the validation rules for its source.
3. A valid record is written to a data lake partition, and the ingester publishes `EnvelopePersisted`. A record that breaks a rule goes to quarantine instead, and the ingester publishes `EnvelopeQuarantined`.
4. The janitor listens to both events and updates the state of the envelope in the inbox to `PERSISTED` or `QUARANTINED`.
5. The mounter reads the data lake partitions and writes the aggregated results to the data mart.

## Events

| Event | Published by | When |
| --- | --- | --- |
| `SourcePayloadCaptured` | crawler | A record has been read from the source. |
| `EnvelopeStored` | crawler, janitor | An envelope is in the inbox and ready to be ingested. The janitor publishes it again for envelopes that got stuck. |
| `EnvelopePersisted` | ingester | A record has been written to the data lake. |
| `EnvelopeQuarantined` | ingester | A record has broken a validation rule. The event lists the violations. |

Every event carries a correlation identifier, shared by all the events about the same record, and the identifier of the event that caused it. Together they let you follow a record through the pipeline.
