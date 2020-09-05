## Installation on Mac

- Go to https://postgresapp.com/downloads.html download and move to `Applications` directory
- Click `Initialize` to create a new server
- Configure your `$PATH` to use the included command line tools
```shell
sudo mkdir -p /etc/paths.d &&
echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
```

## Extensions

- List all extensions installed in the database
```sql
SELECT * FROM pg_extension;

# On psql
\dx
```

- List of available pg extension in the catalog
```sql
SELECT * FROM pg_available_extensions;
```

- List PG-v12 extensions supported on AWS RDS 
https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts.General.FeatureSupport.Extensions.12x

- Install common extensions
```sql
CREATE EXTENSION "uuid-ossp"; # generate uuids
CREATE EXTENSION "pgcrypto"; # crypto functions (hashing, uuids...)
CREATE EXTENSION "postgis";
CREATE EXTENSION "hstore";
CREATE EXTENSION "btree_gist"; # for full text search and geospatial datatypes
CREATE EXTENSION "btree_gin"; # for JSONB/hstore/arrays
```

- Remove extension 
```sql
DROP EXTENSION "{extension name}";
```
