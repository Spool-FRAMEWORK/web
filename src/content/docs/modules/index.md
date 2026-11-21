---
title: Modules
description: What each Spool module does, how it is configured and which events it uses.
sidebar:
  label: Overview
  order: 0
---

Each module does one job and talks to the others only through events. A node can run any combination of them.

| Module | What it does | Descriptor | Java builder |
| --- | --- | --- | --- |
| [crawler](/modules/crawler/) | Reads a source and stores each record in the inbox. | Yes | `CrawlerBuilderFactory` |
| [ingester](/modules/ingester/) | Validates records and writes them to the data lake. | Yes | `IngesterBuilderFactory` |
| [janitor](/modules/janitor/) | Keeps the inbox up to date, retries stuck records and deletes old ones. | Yes | `JanitorBuilderFactory` |
| [validator](/modules/validator/) | Finds your validation rules and runs them for the ingester. | Not needed | Not needed |
| [mounter](/modules/mounter/) | Aggregates data lake partitions into a data mart. | No | `MounterBuilderFactory` |
| [watchdog](/modules/watchdog/) | Receives heartbeats and reports the health of every module. | No | Runs as its own service |

A module declared in the [descriptor](/dsl/) gets its infrastructure from the `infrastructure` block. A module built in Java receives its ports directly, and is registered in a `SpoolNode` with `register` before the node starts.
