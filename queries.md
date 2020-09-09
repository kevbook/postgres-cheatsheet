## Queries

### Simple Operations

```sql
SELECT * FROM "account"."account"
  WHERE "active" = true
    AND created >= '2012-01-01';
```

### Combine records from different tables with `CROSS JOIN`

- Let’s say you have 2 users and 3 categories and you want a query to return the combination of all the records, resulting in 6 rows.

```sql
SELECT users.id AS user_id, categories.id AS category_id
  FROM users CROSS JOIN categories
```

### Window Functions


### Set Operations

- Combine the result set of two or more queries with `UNION`
- Minus a result set using `EXCEPT`
- Get intersection of the result sets with `INTERSECT`

```sql
SELECT * FROM table1
UNION
SELECT * FROM table2;

SELECT * FROM table1
EXCEPT
SELECT * FROM table2;

SELECT * FROM table1
INTERSECT
SELECT * FROM table2;
```

## CTEs (Common Table Expressions)

http://postgresguide.com/cool/ctes.html


