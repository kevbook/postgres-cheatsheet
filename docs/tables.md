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
CREATE INDEX CONCURRENTLY "idx_column"
  ON "{schema name}"."{table name}" USING btree ("{column name}"
    [ ASC | DESC ] [ NULLS { FIRST | LAST } ]);

-- Partial Index
CREATE INDEX CONCURRENTLY "idx_column"
  ON "{schema name}"."{table name}" USING btree ("{column name}"
    [ ASC | DESC ] [ NULLS { FIRST | LAST } ])
  WHERE "user_active" = TRUE;

-- Expression indexes
CREATE INDEX CONCURRENTLY "idx_column"
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
- Cannot be a computed column.
- If you use primary-foreign-keys, like 2 FK's as a PK in a M-to-N table, you will have an index on the PK and probably don't need to create any extra indexes.
- `ON { UPDATE | DELETE } RESTRICT` will restrict any changes to be made to the referenced column. https://www.postgresqltutorial.com/postgresql-foreign-key/

```sql
ALTER TABLE "{schema name}"."{table name}"
  ADD CONSTRAINT "fkey_column" FOREIGN KEY ("{column name}")
    REFERENCES "{schema name}"."{table2 name2}" ("{column name}")
    ON { UPDATE | DELETE } { RESTRICT | CASCADE }

-- Set the referenced value on UPDATE or DELETE to NULL (action statement)
ALTER TABLE "{schema name}"."{table name}"
  ADD CONSTRAINT "fkey_column" FOREIGN KEY ("{column name}")
    REFERENCES "{schema name}"."{table2 name2}" ("{column name}")
    ON { UPDATE | DELETE } { action statement }

{ action statement } = [ SET NULL | SET DEFAULT | RESTRICT | NO ACTION | CASCADE ]
```

- If you are adding the `FOREIGN KEY` constraint to an existing table. `CREATE INDEX` and then use that to the `ADD CONSTRAINT` statement to add the FOREIGN KEY constraint to the column. https://www.cybertec-postgresql.com/en/index-your-foreign-key/

```sql
CREATE INDEX CONCURRENTLY "idx_column"
  ON "{schema name}"."{table name}" USING btree ("{column name}")

ALTER TABLE "{schema name}"."{table name}"
  ADD CONSTRAINT "idx_column" FOREIGN KEY ("{column name}")
    REFERENCES "{schema name}"."{table2 name2}" ("{column name}")
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

### `DEFERRABLE` Constraints

- [See this](https://hashrocket.com/blog/posts/deferring-database-constraints#deferrable-constraints)
- Constraints are immediately enforced. This behavior can be changed within a transaction by changing a constraints deferrable characteristics. By default constraints are `NOT DEFERRABLE`
- Checking of constraints that are deferrable can be postponed until the end of the transaction. `DEFERRABLE INITIALLY IMMEDIATE` or `DEFERRABLE INITIALLY DEFERRED`.
  + `INITIALLY IMMEDIATE` the constraint will by default behave just like a non-deferrable constraint, checking every statement immediately.
  + `INITIALLY DEFERRED` the constraint will defer its checks until the transaction is committed.
- It's a good idea to use the `INITIALLY IMMEDIATE` option, until we explicitly opt in to the deferral `SET CONSTRAINTS "{constraint name} DEFERRED`
- `UNIQUE, PRIMARY KEY, EXCLUDE, and REFERENCES (foreign key)` constraints accept this clause. `NOT NULL and CHECK` constraints are not deferrable.
- Note that deferrable constraints cannot be used as conflict arbitrators in an INSERT statement that includes an ON CONFLICT DO UPDATE clause.

## `REINDEX`ing

- `REINDEX` command will lock the table for any write operations. Use `CONCURRENTLY`
- To figure out indexes that a table has and the corresponding bloat percentage for each of them, you can use this query (we picked it up from PgHero’s codebase). https://gist.github.com/mbanck/9976015/71888a24e464e2f772182a7eb54f15a125edf398
- https://github.com/ankane/pghero
- https://ankane.org/introducing-dexter

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
