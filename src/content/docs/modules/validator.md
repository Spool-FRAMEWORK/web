---
title: validator
description: Write validation rules as Java classes; the ingester finds them and runs them for each record.
sidebar:
  order: 4
---

A validation rule is a Java class. The ingester finds every rule on the classpath and runs the ones registered for the source of each record. You do not declare rules in the descriptor.

Artifact: `validator` 1.2.0, included in the runtime.

## Write a rule

A rule implements `Validator<T>` for the class of the record and is annotated with `@Validate`, which names that class and the source:

```java title="AmountLimit.java"
import software.spool.validator.api.Validate;
import software.spool.validator.api.Validator;

@Validate(value = Order.class, sourceId = "orders-api")
public class AmountLimit implements Validator<Order> {
    @Override
    public boolean validate(Order order) {
        return order.amount() <= 200;
    }

    @Override
    public String failMessage(Order order) {
        return "Order " + order.orderId() + " exceeds 200: " + order.amount();
    }
}
```

The record class is read from the payload with Jackson, so the field names must match the source:

```java title="Order.java"
import com.fasterxml.jackson.annotation.JsonProperty;

public record Order(
        @JsonProperty("order_id") String orderId,
        String customer,
        double amount,
        String currency
) {}
```

`validate` returns `false` when the record breaks the rule, and `failMessage` is the text recorded as the violation.

## How rules are found

The validator artifact includes an annotation processor. When you compile, it writes every class annotated with `@Validate` into `META-INF/services/software.spool.validator.api.Validator`, and the ingester loads them from there with `ServiceLoader`. Your build must run annotation processors from the classpath: JDK 21 does by default, and JDK 23 and later need `-proc:full`.

## Annotation options

| Attribute | Meaning | Default |
| --- | --- | --- |
| `value` | Class the payload is read as. | Required |
| `sourceId` | Source whose records the rule checks. | Required |
| `severity` | `CRITICAL` or `WARNING`. | `CRITICAL` |
| `order` | Rules with a lower number run first. Rules without it run last, in alphabetical order of class name. | Last |

## What happens to an invalid record

A record that breaks a rule is not written to the data lake. What happens next depends on how the ingester was built; see [Quarantine](/modules/ingester/#quarantine).
