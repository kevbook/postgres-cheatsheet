## Tables

### Temp Tables

- Temp table is a table that will go away at the end of the session.

```sql
CREATE TEMP TABLE [IF NOT EXISTS] "{schema name}"."{table name}" (id SERIAL)
```

### `PRIMARY KEY`

- A unique index is automatically created with `PRIMARY KEY`.
- `PRIMARY KEY` can not be `NULL`
- Don't use serial for `PRIMARY KEY`, identity columns should be used instead. The serial types have some weird behaviors that make schema, dependency, and permission management unnecessarily cumbersome. [See here](https://www.2ndquadrant.com/en/blog/postgresql-10-identity-columns)

```sql
CREATE TABLE "{schema name}"."{table name}" (
  "id" serial PRIMARY KEY,
  "name" varchar
);

-- New way
CREATE TABLE "{schema name}"."{table name}" (
  "id" int GENERATED { ALWAYS | BY DEFAULT } AS IDENTITY PRIMARY KEY,
  "name" varchar
);

-- Add PK after table creation
ALTER TABLE "{schema name}"."{table name}"
  ADD CONSTRAINT `pkey_column` PRIMARY KEY ("{column name}");
```

### `INDEX` (Used for Queries)

- Expression indexes are useful for queries that match on some function or modification of your data. See example below. [See here](https://devcenter.heroku.com/articles/postgresql-indexes)

```sql
CREATE INDEX CONCURRENTLY `idx_column`
  ON "{schema name}"."{table name}" USING btree ("{column name}"
    [ ASC | DESC ] [ NULLS { FIRST | LAST } ]);

-- Partial Index
CREATE INDEX CONCURRENTLY `idx_column`
  ON "{schema name}"."{table name}" USING btree ("{column name}"
    [ ASC | DESC ] [ NULLS { FIRST | LAST } ])
  WHERE "user_active" = TRUE;

-- Expression indexes
CREATE INDEX CONCURRENTLY `idx_column`
  ON "{schema name}"."{table name}" (lower(email));
```

### `UNIQUE` Constraints

- A unique index is automatically created with `UNIQUE CONSTRAINT`.
- The preferred way to add a unique constraint to a table is `ALTER TABLE … ADD CONSTRAINT`.
- `NULL` values are not considered unique.
- Example of `partial unique index ` - let's say you have a scenario where only 1 item can be active per parent group but many inactive items. [See here](https://medium.com/little-programming-joys/unique-partial-indexes-with-postgresql-86e137905c12)

```sql
ALTER TABLE "{schema name}"."{table name}"
  ADD CONSTRAINT "unique_column" UNIQUE ("{column name}");

-- Multicolumn
ALTER TABLE "{column name}"
  ADD CONSTRAINT "unique_column1_column2"
    UNIQUE ("{column1 name}", "{column2 name}");

-- Sometimes you want uniqueness based certain criteria
-- We can partial unique index (Note: its not unique constraint but index)
CREATE UNIQUE INDEX "idx_unique_column1_column2"
  ON "{schema name}"."{table name}" ("{column1 name}", "{column2 name}")
  WHERE ("{column1 name}" IS NOT NULL);
```

### `FOREIGN KEY` Constraint

- You have to create indexes on `FOREIGN KEY` if you want them.
- `FOREIGN KEY` can be `NULL` unless you do not want that.
- If you use primary-foreign-keys, like 2 FK's as a PK in a M-to-N table, you will have an index on the PK and probably don't need to create any extra indexes.
- `ON { UPDATE | DELETE } RESTRICT` will restrict any changes to be made to the referenced column.

```sql
ALTER TABLE "{schema name}"."{table name}"
  ADD CONSTRAINT "fkey_column" FOREIGN KEY ("{column name}")
    REFERENCES "{schema name}"."{table2 name2}" ("{column name}")
    ON { UPDATE | DELETE } { RESTRICT | CASCADE }
```

### `CHECK` Constraint

```sql
CREATE TABLE "{schema name}"."{table name}" (
  price NUMERIC,
  discount NUMERIC
);

ALTER TABLE "{schema name}"."{table name}"
  ADD CONSTRAINT "check_discount"
    CHECK (price > discount AND price > 10);
```

## Columns

```sql
-- Add a column
ALTER TABLE "{schema name}"."{table name}"
  ADD COLUMN "{column name}" TYPE;

-- Drop a column
ALTER TABLE "{schema name}"."{table name}"
  DROP COLUMN "{column name}";

ALTER TABLE "{schema name}"."{table name}"
  RENAME "{column name}" TO "{new column name}";

-- Set or remove a default value for a column:
ALTER TABLE  "{column name}"
  ALTER COLUMN [SET DEFAULT "{value}" | DROP DEFAULT];

```
