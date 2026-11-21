---
title: Operations
description: Send traces, logs and metrics to a collector, run the local observability stack and check the health of a node.
sidebar:
  label: Operations
  order: 1
---

A Spool node reports what it does in three ways. It sends OpenTelemetry signals (traces, logs and metrics), it answers on a health endpoint, and its modules send heartbeats to the [watchdog](/modules/watchdog/).

## Telemetry

Spool exports traces, logs and metrics with OTLP over HTTP. Each endpoint is taken from the first place that defines it.

1. The `OpenTelemetryConfiguration` passed to the runtime.
2. An environment variable.
3. A default that points to the [local stack](#local-observability-stack).

| Signal | Builder method | Environment variable | Default |
| --- | --- | --- | --- |
| Traces | `tracesEndpoint` | `OTEL_TRACES_ENDPOINT` | `http://localhost:4318/v1/traces` |
| Logs | `logsEndpoint` | `OTEL_LOGS_ENDPOINT` | `http://localhost:3100/otlp/v1/logs` |
| Metrics | `metricsEndpoint` | `OTEL_METRICS_ENDPOINT` | `http://localhost:4320/v1/metrics` |

```java
SpoolRuntime.builder()
        .OpenTelemetryConfiguration(OpenTelemetryConfiguration.builder()
                .serviceName("orders-pipeline")
                .tracesEndpoint("http://collector:4318/v1/traces")
                .logsEndpoint("http://loki:3100/otlp/v1/logs")
                .metricsEndpoint("http://collector:4320/v1/metrics")
                .build())
        .withNodeFromDSL("/Spool.yaml")
        .build()
        .start();
```

The service name works the other way round. When the `SERVICE_NAME` environment variable is set, it replaces the one in the code. OpenTelemetry is configured once per process, so if several runtimes are built in the same process, the first configuration is the one that applies.

When nothing is listening at an endpoint, the node keeps working and logs `Failed to export` for that signal.

## Local observability stack

The [devenv](https://github.com/Spool-FRAMEWORK/devenv) repository runs Grafana, Tempo, Loki, Prometheus and an OpenTelemetry Collector with Docker Compose. Its ports match the defaults above, so a node started without endpoints sends everything to it.

```sh
git clone https://github.com/Spool-FRAMEWORK/devenv.git
cd devenv
docker compose up
```

| Service | Port | Receives |
| --- | --- | --- |
| Grafana | 3000 | The user interface, without login. |
| Tempo | 4318 | Traces. |
| Loki | 3100 | Logs. |
| OpenTelemetry Collector | 4320 | Metrics, which it passes on to Prometheus. |
| Prometheus | 9090 | Metric queries. |

Grafana comes with a dashboard for the crawler, the ingester, the janitor and the watchdog, in the Spool folder.

## Metrics

| Module | Metrics |
| --- | --- |
| crawler | `spool.crawler.events.total`, `spool.crawler.errors.total`, `spool.crawler.latency` |
| ingester | `spool.ingester.records.total`, `spool.ingester.records.rejected.total`, `spool.ingester.processing.duration`, `spool.ingester.record.size` |
| janitor | `spool.janitor.records.cleaned.total`, `spool.janitor.cycles.completed.total`, `spool.janitor.cycles.failed.total`, `spool.janitor.cycle.duration` |
| mounter | `spool.mounter.datasets.mounted.total`, `spool.mounter.remounts.total`, `spool.mounter.mount.latency` |
| any module | `spool.module.started.total`, `spool.module.stopped.total`, `spool.module.degraded.total`, `spool.module.active` |
| watchdog | `spool.watchdog.heartbeats.total`, `spool.watchdog.timeouts.total`, `spool.watchdog.zombies.total`, `spool.watchdog.check.duration`, `spool.watchdog.module.downtime`, `spool.watchdog.healthy.ratio`, `spool.watchdog.modules.active` |

The janitor counts deleted and quarantined envelopes in the same metric, and tells them apart with the `reason` attribute, which is `expired` or `quarantine`.

## Node health

Every node answers on port 8080 with the state of its modules.

| Path | Use |
| --- | --- |
| `/spool/health` | Full report. |
| `/spool/health/live` | Liveness probe. |
| `/spool/health/ready` | Readiness probe. |

This is the start of the report of the node in [Build your first pipeline](/getting-started/first-pipeline/), whose crawler checks its inbox, its event bus and its source.

```json
{
  "nodeId": "spool-node-dfc7096f",
  "status": "HEALTHY",
  "modules": [
    {
      "moduleId": "NOOP",
      "status": "HEALTHY",
      "checks": [
        { "name": "inbox", "status": "HEALTHY", "reason": null },
        { "name": "event-bus", "status": "HEALTHY", "reason": null },
        { "name": "source", "status": "HEALTHY", "reason": null }
      ],
      "timestamp": 1795295143.5187848
    }
  ]
}
```

When the descriptor has no `watchdog`, every module appears in this report as `NOOP`.
