## Views

###  Materialized Views

- Allows you to store result of a query and update the data periodically.
- A materialized view caches the result of a complex expensive query and then allow you to refresh this result periodically.
- The materialized views are useful in many cases that require fast data access therefore they are often used in data warehouses or business intelligent applications.
- To load data at the creation time, `WITH DATA` option is used. Otherwise `WITH NO DATA`.
- When you refresh data for a materialized view, Postgres locks the entire table therefore you cannot query data against it. To avoid this, you can use the `CONCURRENTLY` option.

```sql
CREATE MATERIALIZED VIEW "{schema name}"."{view name}"
  AS query WITH [NO] DATA;

-- Refresh data
REFRESH MATERIALIZED VIEW "{schema name}"."{view name}";

-- To use [CONCURRENTLY], view must have a UNIQUE index
REFRESH MATERIALIZED VIEW [CONCURRENTLY] "{schema name}"."{view name}";

CREATE UNIQUE INDEX "idx_unique_column"
  ON "{schema name}"."{view name}" ("{column name}");
```
