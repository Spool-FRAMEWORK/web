---
title: Ports and backends
description: The infrastructure Spool depends on, the backends available for each piece and their configuration.
sidebar:
  label: Overview
  order: 0
---

Modules never depend on a specific technology. Each piece of infrastructure is a port, and a plugin provides it. In a descriptor you pick the plugin by its `type` and pass its settings in `configuration`.

The plugins below come in the `infrastructure` artifact, version 1.3.0, included in the runtime.

## Event bus

| `type` | Configuration | Notes |
| --- | --- | --- |
| `IN_MEMORY` | None | Every module must run in the same node. |
| `KAFKA` | `bootstrap.servers` | Modules can run in different nodes. |

## Inbox

| `type` | Configuration |
| --- | --- |
| `FILE_SYSTEM` | `path`: folder of the inbox. It holds one subfolder per envelope state. |
| `S3` | See [S3](#s3). |

## Data lake

| `type` | Configuration | Notes |
| --- | --- | --- |
| `FILE_SYSTEM` | `path`: root folder of the data lake. | The mounter can read it. |
| `S3` | See [S3](#s3). | The ingester can write to it; there is no reader for the mounter in this version. |

## S3

The S3 inbox and data lake take the same keys:

| Key | Meaning |
| --- | --- |
| `bucket` | Name of the bucket. |
| `region` | AWS region, for example `eu-west-1`. |
| `endpoint` | URL of an S3-compatible store such as MinIO or R2. Leave it empty for AWS. |
| `accessKeyEnv`, `secretKeyEnv` | Names of the environment variables that hold the credentials. Give both or neither; without them the default AWS credential chain is used. |

```yaml
inbox:
  type: S3
  configuration:
    bucket: spool-inbox
    region: eu-west-1
    endpoint: ""
    accessKeyEnv: SPOOL_S3_ACCESS_KEY
    secretKeyEnv: SPOOL_S3_SECRET_KEY
```

The descriptor never holds a secret, only the names of the variables.

## Sources

| Plugin | Crawler type | Configuration |
| --- | --- | --- |
| `HTTP` | `POLL` | `url`, `sourceId` |
| `IN_MEMORY` | `STREAM` | `eventClassName` (a class in the `events` package), `sourceId` |

## Media types

The crawler's `mediaType` picks how a response is split into records: `JSON`, `JSON_ARRAY`, `EVENT_CLASS`, `EVENT_CLASS_ARRAY` or `PDF`. See [crawler](/modules/crawler/#from-response-to-records).

## Data mart

Used by the mounter in Java:

| Plugin | Configuration | Writes |
| --- | --- | --- |
| `FILE_SYSTEM` | `path` | Each result as JSON. |
| `RAW_FILE_SYSTEM` | `path` | Each result as raw bytes, for files such as PDFs. |

## Your own plugins

A plugin is a class that implements one of the provider interfaces in `software.spool.infrastructure.spi.provider` and carries the `@SpoolPlugin` annotation with that interface. Spool finds it by scanning the classpath, and the value returned by `name()` is the `type` you write in the descriptor.

```java
@SpoolPlugin(PollSourceProvider.class)
public class GazettePollSourceProvider implements PollSourceProvider {
    @Override
    public String name() {
        return "GAZETTE_HTTP";
    }

    @Override
    public int priority() {
        return 10;
    }

    @Override
    public boolean supports(PluginConfiguration configuration) {
        return configuration.has("url") && configuration.has("sourceId");
    }

    @Override
    public PollSource<?> create(PluginConfiguration configuration) {
        return new GazettePollSource(configuration.require("url"), configuration.require("sourceId"));
    }
}
```

Each key of the `configuration` block in the descriptor reaches the plugin through `PluginConfiguration`.
