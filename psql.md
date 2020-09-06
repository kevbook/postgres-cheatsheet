## Psql

- Start interactive pg-shell `$ psql -d {database name}`

- To quit psql, either works `\q` or `exit`

- Connect to a different database `\c {database name}`

- List version installed `SELECT version();`

- List all extensions installed in the database `\dx`

- Turn query timing on (default is off) `\timing`

- Turn on pretty-format for query output (default is off) `\x`

- List of roles `\du+`

- List schemas `\dn+`

- List all databases `\l+`

- List tables and views `\dp` and `\dt+`

- Describe table `\d+ {table_name}`

- Edit the last SQL statement and execute upon exit `\e`

- The last SQL statement `\g`
