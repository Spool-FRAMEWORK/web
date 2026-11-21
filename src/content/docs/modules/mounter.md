---
title: mounter
description: Reads partitions of the data lake and writes aggregated or transformed results to a data mart.
sidebar:
  order: 5
---

The mounter reads records from data lake partitions, turns them into results with an aggregator you write, and stores those results in a data mart. It is built in Java, because the descriptor does not support it in this version.

The `mounter` artifact, version 1.3.0, is included in the runtime.

## Example

This mounter copies the payload of every record captured from `orders-api` into a data mart called `orders`.

```java title="OrdersMounter.java"
PluginConfiguration dataLake = PluginConfiguration.builder().with("path", "spool-data/datalake").build();
PluginConfiguration dataMart = PluginConfiguration.builder().with("path", "spool-data/datamart").build();
PartitionKey orders = PartitionKey.ofEntriesWithoutDate()
        .with("source", "orders-api")
        .build();

Mounter mounter = MounterBuilderFactory.<GenericRecord, Map<String, Object>>polling(
                PluginResolver.resolve(PartitionedReaderProvider.class, dataLake))
        .aggregatingWith(records -> records.map(partitioned -> new AggregatedRecord<>(
                partitioned.record(),
                partitioned.record().getNested("payload").toMap())))
        .mount()
            .onTarget(MountTarget.transformation("orders", orders))
            .writingWith(PluginResolver.get(DataMartWriterProvider.class, "FILE_SYSTEM").create(dataMart))
            .partitioningWith((record, payload, target) -> orders)
            .and()
        .checkpoint()
            .windowPolicy(new AlwaysClosedWindowPolicy())
            .checkpoint(new NoOpMountCheckpoint())
            .and()
        .scheduling()
            .pollingWith(PollingPolicy.ONCE)
            .emittingWith(new InMemoryEventBus())
            .and()
        .build();

SpoolNode node = SpoolNode.create();
node.register(mounter);
node.start();
```

Run after [Build your first pipeline](/getting-started/first-pipeline/), it writes one file per order.

```
spool-data/datamart/silver/orders/source=orders-api/<hash>.json
```

```json
{"order_id":"A-1002","customer":"Globex","amount":75.0,"currency":"EUR"}
```

## The parts of a mounter

| Part | Builder call | What it decides |
| --- | --- | --- |
| Reader | `polling(reader)` | Where the records come from. Only the `FILE_SYSTEM` data lake has a reader in this version. |
| Aggregator | `aggregatingWith` | How records become results. It receives the records of a partition and returns one `AggregatedRecord` per result. |
| Target | `onTarget` | The data mart and the partitions to read. `transformation` writes to `silver/<name>`, `aggregation` to `gold/<name>`. |
| Writer | `writingWith` | Where results are stored. `FILE_SYSTEM` writes JSON and `RAW_FILE_SYSTEM` writes the bytes as they are, for files such as PDFs. |
| Partitioning | `partitioningWith` | The partition of each result in the data mart. |
| Window policy | `windowPolicy` | Which partitions are closed and can be read. `AlwaysClosedWindowPolicy` treats all of them as closed. |
| Checkpoint | `checkpoint` | What has already been mounted. `NoOpMountCheckpoint` remembers nothing, so every run reads everything again. |
| Scheduling | `pollingWith`, `emittingWith` | How often it runs (`PollingPolicy.ONCE` runs once) and where it publishes its events. |

The aggregator must return values the writer can serialize. In this version the included `PassThroughMountAggregator` returns `GenericRecord`, which the `FILE_SYSTEM` writer cannot serialize. That is why the example above returns a map.
