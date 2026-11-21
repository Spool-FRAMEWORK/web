---
title: janitor
description: Keeps the inbox up to date, publishes stuck envelopes again and deletes the ones that are no longer needed.
sidebar:
  order: 3
---

The janitor looks after the inbox. On every run it:

1. Sets to `PERSISTED` the envelopes the ingester has written, from the `EnvelopePersisted` events received since the last run.
2. Sets to `QUARANTINED` the envelopes in `EnvelopeQuarantined` events.
3. Deletes the `PERSISTED` envelopes older than `millisecondsTTL`.
4. Publishes again, as `EnvelopeStored`, the envelopes that have been in `CAPTURED` for longer than `millisecondsThreshold`, and increases their retry counter. When the counter reaches three, it sets them to `QUARANTINED` instead.

Artifact: `janitor` 1.2.1, included in the runtime.

## Configuration

| Key | Meaning | Default |
| --- | --- | --- |
| `milliseconds` | Time between runs. | 5000 |
| `millisecondsThreshold` | How long an envelope can stay in `CAPTURED` before it is published again. | 3 minutes |
| `millisecondsTTL` | How long a `PERSISTED` envelope stays in the inbox. | 1 day |

```yaml
- janitor:
    id: orders-janitor
    configuration:
      milliseconds: 5000
      millisecondsThreshold: 10000
      millisecondsTTL: 60000
```

The maximum number of retries can only be changed in Java, with `withMaxRetries` on the janitor builder.

[Envelope lifecycle](/concepts/envelope-lifecycle/) explains the states in detail.
