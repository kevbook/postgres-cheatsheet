## Queries

## Set operations

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
