## Schemas

```
|-------------------------------------------|---|
| Postgres Instance                         |   |
|-------------------------------------------| U |
|     Database 1      |     Database 2      | S |
|---------------------|---------------------| E |
| Schema 1 | Schema 2 | Schema 1 | Schema 2 | R |
|----------|----------|----------|----------| S |
| t1,t2,t3 | t1,t2,t3 | t1,t2,t3 | t1,t2,t3 |   |
-------------------------------------------------
```

- Schema is a namespace that contains named database objects such as tables, views, indexes, data types, functions, stored procedures and operators. 
- Schema's enable multiple users to use one database without interfering with each other. 
- If you do not explicitly specify a schema, `pubic` schema will be used (based on search path). The search path is a list of schema names that postgres checks when you don’t use a qualifier to the database object. 

```sql
-- View the schemas search path
SHOW search_path; # "$user", public
```

```sql
-- Create new schema
CREATE SCHEMA "{schema name}";

-- Below two statements are the same (public schema is used by default based on search path) 
CREATE TABLE "{table name}"(id SERIAL);
CREATE TABLE "public"."{table name}"(id SERIAL);
```

## Users and Roles

| Statement | Permission | Object | Role |  
| --------- | ---------- | ------ | ---- |
| GRANT     | SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE, ALL | ON (Object) | TO |
| REVOKE    | SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE, ALL | ON (Object) | FROM |

```sql
-- Get list roles with attributes and membership
SELECT *,
  ARRAY(SELECT b.rolname
    FROM pg_catalog.pg_auth_members m
    JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
    WHERE m.member = r.oid) as memberof
FROM pg_catalog.pg_roles r
WHERE r.rolname NOT IN ('pg_signal_backend','pg_read_all_settings','pg_read_all_stats','pg_stat_scan_tables','pg_monitor',
                        'pg_read_server_files','pg_write_server_files','pg_execute_server_program',
                        'rds_iam','rds_replication','rds_superuser','rdsadmin','rdsrepladmin')
ORDER BY 1;

-- Get list roles with object permissions
SELECT * FROM information_schema.table_privileges 
WHERE grantee NOT IN ('PUBLIC','postgres');
```

```sql
SELECT grantee, table_schema, table_name, ARRAY_TO_STRING(ARRAY_AGG(privilege_type), ', ') AS grants
FROM information_schema.role_table_grants
WHERE table_schema NOT IN ('information_schema','pg_catalog')
GROUP BY table_name, table_schema, grantee;

SELECT * FROM information_schema.role_usage_grants WHERE grantee != 'PUBLIC'
GROUP BY table_name, table_schema, grantee;

SELECT * FROM information_schema.role_usage_grants WHERE grantee = 'labs_readonly';

SELECT * FROM information_schema.role_table_grants WHERE grantee = 'labs_readonly';
SELECT * FROM information_schema.role_column_grants WHERE grantee = '{user}';
SELECT * FROM information_schema.role_routine_grants WHERE grantee = '{user}';
SELECT * FROM information_schema.role_udt_grants WHERE grantee = '{user}';
```

### Roles

- You should create roles with specific sets of permissions, then assign the role to each user (instead of assigning permissions directly to the user).
- All new users and roles inherit permissions from the `PUBLIC` (`PUBLIC` is a group of all users and roles). Ie. It's grantd access to the `public` schema and the database (https://www.postgresql.org/docs/current/sql-grant.html). We should remove this default functionality. Users and roles should be granted the permissions explicitly. (https://aws.amazon.com/blogs/database/managing-postgresql-users-and-roles/)

```sql
-- Revoke all access from PUBLIC
REVOKE ALL ON SCHEMA "public" FROM PUBLIC;
REVOKE ALL ON DATABASE "{database name}" FROM PUBLIC;
```

- Permissions to the role must be granted at the database, schema, and schema object level.
![](https://d2908q01vomqb2.cloudfront.net/887309d048beef83ad3eabf2a79a64a389ab1c9f/2019/03/01/managing-postgresql-users-3.gif)

```sql
-- Create readonly role (inherits PUBLIC by default)
CREATE ROLE "labs_readonly" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT NOLOGIN;

-- GRANT {CONNECT | CREATE | TEMPORARY | ALL} ON DATABASE "{database name}" TO "labs_readonly";
GRANT CONNECT ON DATABASE "{database name}" TO "labs_readonly";

-- GRANT {CREATE | USAGE | ALL} ON SCHEMA "{schema name}" TO "labs_readonly";
GRANT USAGE ON SCHEMA "{schema name}" TO "labs_readonly";

-- To grant the labs_readonly access to select tables and views
GRANT SELECT ON TABLE "mytable1", "mytable2" TO "labs_readonly";

-- To grant the labs_readonly access to all tables and views
GRANT SELECT ON ALL TABLES IN SCHEMA "{schema name}" TO "labs_readonly";

-- Note that any new tables that get added in the future will not be accessible by the labs_readonly role
-- To ensure that new tables and views are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema name}" GRANT SELECT ON TABLES TO "labs_readonly";
```

```sql
# Create readwrite role (inherits PUBLIC by default)
CREATE ROLE "labs_readwrite" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT NOLOGIN;
GRANT CONNECT ON DATABASE "{database name}" TO "labs_readwrite";
GRANT USAGE ON SCHEMA "{schema name}" TO "labs_readwrite";

# To grant the labs_readwrite access to select tables and views
GRANT SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE ON TABLE "mytable1", "mytable2" TO "labs_readwrite";

# To grant the labs_readwrite access to all tables and views
GRANT SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA "{schema name}" TO "labs_readwrite";

# Note that any new tables that get added in the future will not be accessible by the labs_readwrite role
# To ensure that new tables and views are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema name}" GRANT SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE ON TABLES TO "labs_readwrite";

# For read/write roles, there is normally a requirement to use sequences also.
GRANT USAGE ON SEQUENCE "myseq1", "myseq2" TO "labs_readwrite";

# To grant the labs_readwrite access to all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA "{schema name}" TO "labs_readwrite";

# To automatically grant permissions to sequences added in the future
ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema name}" GRANT USAGE ON SEQUENCES TO "labs_readwrite";
```

### Users

- Create user and grant it roles

```sql
CREATE USER "labs_user1" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NHERIT LOGIN PASSWORD 'pass';

# Grant user to role
GRANT "labs_readonly" TO "labs_user1";

# Revoke user from role
REVOKE "labs_readonly" FROM "labs_user1";
```

Additionally some of these roles were created with NOINHERIT attribute. As discussed earlier, ordinarily, when one role is a member of a second role, the former gets immediate access to all of the privileges granted to the latter. However when a role has the NOINHERIT attribute, the privileges are not automatically possessed, and the first role must explicitly escalate to the second using SET ROLE in order to access them.

Now user1 can only connect to the cluster, because it does not inherit the privileges of rw_demo12 automatically. In order to view the data, user1 has to explicitly do SET ROLE TO readonly . Likewise, if user1 wants to insert values into certain tables, or CREATE NEW TABLES (which is banned in our proposed solution), user1 needs to SET ROLE TO rw_demo12 . In this way, all new future objects created by user1 or user2 will be owned by rw_demo12 . So you see, this alternative solution is more flexible, but with the sacrifice of user experience.



LOGIN PASSWORD 'secret_passwd';
CREATE ROLE username NOINHERIT LOGIN PASSWORD password;

