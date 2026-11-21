---
title: Keep an assistant's knowledge base up to date
description: Use Spool to turn the issues and documents of a Linear workspace into a vector knowledge base for a virtual assistant, so that every answer can name its sources.
sidebar:
  label: Assistant knowledge base
  order: 1
---

A virtual assistant that answers questions about a team's work needs a knowledge base that follows the team's issues and documents as they change. It also needs to say where each answer comes from, or nobody can check it. This page describes how a Spool pipeline can do both, with Linear as the source.

Spool runs the whole preparation of the knowledge base: it reads Linear, keeps track of what changed, splits the documents into chunks, computes their embeddings and stores them in a vector database. Only the assistant that answers questions is outside Spool.

## The pipeline

1. Two **crawlers** poll the Linear API on a schedule, one for issues and one for documents. Linear has no plugin in Spool, so the pipeline adds a poll source of its own; [Ports and backends](/ports/#your-own-plugins) shows how. Each issue and each document becomes a record.
2. Each crawler maps its records to one class, `LinearIssue` or `LinearDocument`, so the data lake keeps them in separate partitions (`eventType=LinearIssue`, `eventType=LinearDocument`). One crawler per class matters: when a crawler lists several classes, it uses the first one that can read the record, and a lenient class can read almost anything.
3. The **ingester** writes every new or changed record to the data lake.
4. A **mounter** reads the data lake, splits each issue and document into chunks in Markdown, computes the embedding of every chunk and writes the result to the gold layer of a data mart stored in [Qdrant](https://qdrant.tech).
5. The assistant searches Qdrant for the chunks closest to each question and answers from them.

## The mounter

The mounter does the work that turns records into a knowledge base, with two pieces written for the pipeline:

- An **aggregator** that receives the records of a partition and, for each issue or document, converts the content to Markdown, splits it into chunks and asks an embedding model for the vector of each chunk. Every chunk is one result, with its text, its vector and the metadata of the record it comes from.
- A **data mart writer** for Qdrant: a plugin that implements `DataMartWriterProvider` and carries `@SpoolPlugin`, like any other [plugin](/ports/#your-own-plugins). It stores every chunk as a point in a Qdrant collection, with the metadata as its payload.

The mounter writes with `MountTarget.aggregation`, so the knowledge base is the gold layer of the data mart. Raw records stay in bronze, and every chunk in gold can be traced back to the envelope it was built from. [mounter](/modules/mounter/) describes the rest of its parts.

## Only what changed

The idempotency key of an envelope is a SHA-256 of the source and the content of the record. When the crawler reads an issue that has not changed since the last run, the key is the same and the inbox does not store it again. When the issue has been edited, its content is different, so it gets a new envelope and travels through the pipeline. The knowledge base receives the changes, not the whole workspace on every run.

## Sources in every answer

Each envelope carries metadata that identifies it: the source it came from and a correlation identifier shared by every event about that record. The record itself can keep the fields that matter to a reader, such as the URL of the issue or the name of the document.

The aggregator copies these values into the metadata of each chunk, and the Qdrant writer stores them in the payload of its point:

| Metadata | Comes from |
| --- | --- |
| Correlation identifier | `CORRELATION_ID` in the metadata of the envelope. |
| Source | `SOURCE` in the metadata of the envelope. |
| URL and title | Fields of the record, as read from Linear. |

When the assistant answers, it returns the metadata of the chunks it used, so every answer lists the issues and documents it is based on. The correlation identifier also leads back from an answer to the envelope in the data lake and to the events of the pipeline, which helps when an answer looks wrong and someone needs to know which version of a document it used.

## Records in the descriptor

The crawlers of such a descriptor look like this. `LINEAR` stands for the source plugin written for the pipeline, with an `entity` setting that tells it what to read, and `LinearIssue` and `LinearDocument` for its record classes:

```yaml
- crawler:
    type: POLL
    id: linear-issues
    source:
      type: LINEAR
      configuration:
        sourceId: linear-issues
        url: "https://api.linear.app/graphql"
        entity: issues
        scheduleMilliseconds: 900000
      mediaType: JSON_ARRAY
      rootPath: records
    eventMapping:
      namingConvention: CAMEL_CASE
      domainMappingList:
        - LinearIssue

- crawler:
    type: POLL
    id: linear-documents
    source:
      type: LINEAR
      configuration:
        sourceId: linear-documents
        url: "https://api.linear.app/graphql"
        entity: documents
        scheduleMilliseconds: 900000
      mediaType: JSON_ARRAY
      rootPath: records
    eventMapping:
      namingConvention: CAMEL_CASE
      domainMappingList:
        - LinearDocument
```

The API key goes in an environment variable that the source plugin reads, never in the descriptor.
