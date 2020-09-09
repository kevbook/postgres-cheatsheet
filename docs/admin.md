```sql
SELECT
  relname as table_name,
  n_tup_ins as "inserts",
  n_tup_upd as "updates",
  n_tup_del as "deletes",
  n_live_tup as "live_tuples",
  n_dead_tup as "dead_tuples",
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  vacuum_count,
  autovacuum_count,
  analyze_count,
  autoanalyze_count
FROM pg_stat_user_tables
ORDER BY table_name;
```
