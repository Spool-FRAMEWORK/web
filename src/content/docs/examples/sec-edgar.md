---
title: SEC EDGAR filings
description: A pipeline that captures the 8-K filings published on SEC EDGAR the day before, with a source written for that API.
sidebar:
  order: 1
---

This pipeline asks SEC EDGAR, the public filing system of the US Securities and Exchange Commission, for the 8-K reports filed the day before. Companies file an 8-K to announce events such as a change of executives or an acquisition. Each filing becomes a record in the data lake.

Code: [Spool-FRAMEWORK-Labs/sec-pipeline](https://github.com/Spool-FRAMEWORK-Labs/sec-pipeline), with Spool 1.4.0.

## What it shows

- A **source of your own**. EDGAR needs its own query parameters and headers, so the example adds a `SEC_DAILY_INDEX` poll source instead of using `HTTP`.
- **Records mapped to a Java class**. Each filing is read as a `SecFiling`, so the data lake partition includes the event type.

## The descriptor

```yaml title="src/main/resources/pipeline.yaml"
infrastructure:
  watchdog: "http://host.docker.internal:8090"

  eventBus:
    type: IN_MEMORY

  inbox:
    type: FILE_SYSTEM
    configuration:
      path: "D:/spool/inbox"

  dataLake:
    type: FILE_SYSTEM
    configuration:
      path: "D:/spool/datalake"

modules:
  - crawler:
      type: POLL
      id: sec-crawler
      source:
        type: SEC_DAILY_INDEX
        configuration:
          sourceId: sec-edgar
          url: "https://efts.sec.gov/LATEST/search-index"
          scheduleMilliseconds: 0
        mediaType: JSON_ARRAY
        rootPath: entries
      eventMapping:
        namingConvention: SNAKE_CASE
        domainMappingList:
          - SecFiling

  - ingester:
      id: sec-ingester
      type: REACTIVE

  - janitor:
      id: sec-janitor
      configuration:
        milliseconds: 300000
        millisecondsThreshold: 30000
        millisecondsTTL: 60000
```

With `scheduleMilliseconds: 0` the crawler reads the source once when the node starts. To run it every day, start the program from a scheduler such as cron.

## The source

The `SEC_DAILY_INDEX` plugin is two classes:

- `SECDailyIndexPollSourceProvider` is the plugin. It carries `@SpoolPlugin(PollSourceProvider.class)`, answers to the name `SEC_DAILY_INDEX` and creates the source with the `url` of the descriptor.
- `SECDailyIndexPollSource` does the work. It asks the search index for the 8-K filings of the previous day, New York time, and turns each result into a flat object under `entries`, with the fields `SecFiling` expects: `accession_no`, `cik`, `entity_name`, `form_type`, `file_date` and a `link` to the filing.

The source identifies itself as `SEC-EDGAR-Daily-Api`, and that is the name used in the data lake; the `sourceId` in the descriptor is not read by this plugin.

## The record class

The crawler resolves `SecFiling` in the `events` package and reads every entry with snake case names:

```java title="src/main/java/events/SecFiling.java"
@JsonIgnoreProperties(ignoreUnknown = true)
public record SecFiling(
        @JsonProperty("accession_no") String accessionNo,
        @JsonProperty("entity_name") String entityName,
        String cik,
        @JsonProperty("form_type") String formType,
        @JsonProperty("file_date") String fileDate,
        String link
) implements Event {
    @Override
    public String eventId() {
        return accessionNo;
    }

    @Override
    public String causationId() {
        return "";
    }

    @Override
    public String correlationId() {
        return cik;
    }

    @Override
    public Instant timestamp() {
        if (fileDate == null) return Instant.now();
        return LocalDate.parse(fileDate, DateTimeFormatter.ISO_LOCAL_DATE)
                .atStartOfDay(ZoneId.of("America/New_York"))
                .toInstant();
    }
}
```

## Run it

1. Clone the repository and open `src/main/resources/pipeline.yaml`. Change the two `path` values to folders on your machine, and remove the `watchdog` line if you are not running one.
2. EDGAR rejects requests that do not identify who makes them. In `SECDailyIndexPollSource`, set the `User-Agent` header to your application name and a contact email.
3. Build and run:

```sh
mvn package
java -jar target/sec-pipeline.jar
```

## The result

A run on 21 November 2026 captured 100 filings from the day before. Each one is an envelope in the data lake, under a partition that includes the source and the event type:

```
datalake/bronze/year=2026/month=11/day=21/hour=20/source=SEC-EDGAR-Daily-Api/eventType=SecFiling/<idempotency key>.json
```

Decoded, the payload of one of them starts like this:

```json
{
  "accession_no": "0001628280-26-075170",
  "cik": "0000067887",
  "entity_name": "MOOG INC.",
  "form_type": "8-K",
  "file_date": "2026-11-20",
  "link": "https://www.sec.gov/Archives/edgar/data/67887/000162828026075170/0001628280-26-075170-index.htm"
}
```

The payload also keeps every other field EDGAR returned, such as the industry code and the location of the company, because the envelope stores the record as it came from the source.
