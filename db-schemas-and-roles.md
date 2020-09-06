## Overview

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

## Database

```sql
-- Create database
CREATE DATABASE {database name};

-- Delete database
DROP DATABASE {database name};
```

## Schemas

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

| Statement | Privileges | Object Type | Role |
| --------- | ---------- | ----------- | ---- |
| GRANT, REVOKE | CONNECT, CREATE, TEMPORARY, ALL | DATABASE | TO {role}, FROM {role} |
| GRANT, REVOKE | CREATE, USAGE, ALL | SCHEMA | TO {role}, FROM {role} |
| GRANT, REVOKE | SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE, ALL | TABLE, VIEW, SEQUENCE | TO {role}, FROM {role} |

> https://www.postgresql.org/docs/current/sql-grant.html

> https://gpdb.docs.pivotal.io/560/admin_guide/roles_privs.html

```sql
-- Get list roles with attributes and memberships
SELECT *,
  ARRAY(SELECT b.rolname
    FROM pg_catalog.pg_auth_members m
    JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
    WHERE m.member = r.oid) as memberof
  FROM pg_catalog.pg_roles r
  WHERE r.rolname NOT IN ('pg_signal_backend','pg_read_all_settings',
                          'pg_read_all_stats','pg_stat_scan_tables',
                          'pg_monitor','pg_read_server_files',
                          'pg_write_server_files','pg_execute_server_program',
                          'rds_iam','rds_replication',
                          'rds_superuser','rdsadmin','rdsrepladmin')
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
-- GRANT SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE ON TABLE "mytable1", "mytable2" IN SCHEMA "{schema name}" TO "labs_readonly";
GRANT SELECT ON TABLE "mytable1", "mytable2" IN SCHEMA "{schema name}" TO "labs_readonly";

-- To grant the labs_readonly access to all tables and views
-- GRANT SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA "{schema name}" TO "labs_readonly";
GRANT SELECT ON ALL TABLES IN SCHEMA "{schema name}" TO "labs_readonly";

-- Note that any new tables that get added in the future will not be accessible by the labs_readonly role
-- To ensure that new tables and views are also accessible
-- ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema name}" GRANT SELECT, INSERT, UPDATE, REFERENCES, TRIGGER, DELETE, TRUNCATE ON TABLES TO "labs_readonly";
ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema name}" GRANT SELECT ON TABLES TO "labs_readonly";
```

- Similarly, create two new roles: `labs_readwrite` and `labs_admin`
- `labs_readwrite` has `SELECT, INSERT, UPDATE, REFERENCES, TRIGGER` privileges.
- `labs_admin` has additional `CREATE SCHEMA` privileges.
- `labs_admin` has additional `DELETE, TRUNCATE ON TABLES` privileges.
- For read/write roles, there is normally a requirement to use sequences `USAGE ON ALL SEQUENCES`.

```sql
-- labs_admin needs an additional
GRANT CREATE SCHEMA "{schema name}" TO "labs_admin";

# To grant the labs_readwrite access to all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA "{schema name}" TO "labs_readwrite";

# To automatically grant permissions to sequences added in the future
ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema name}" GRANT USAGE ON SEQUENCES TO "labs_readwrite";
```

### Users

- Create user and grant it roles. When user is a member of a role, it gets access to all of the privileges granted to the role.
- However when a role has the `NOINHERIT` attribute, the privileges are not automatically possessed, user must explicitly escalate to the role using `SET ROLE {role name}` in order to access them.


```sql
CREATE USER "labs_user1" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT LOGIN PASSWORD 'pass';

# Grant user to role
GRANT "labs_readonly" TO "labs_user1";

# Revoke user from role
REVOKE "labs_readonly" FROM "labs_user1";
```


- When creating an object or table (or apply any DDL), DO NOT use the session/logged in user, as postgres will assign the session/logged in user as the `tableowner` (when creating the object).
- `session user` should use the `admin` role to apply changes.

```sql
-- View sogged in session user
SELECT "session_user"();

-- Use admin role
SET ROLE TO "labs_admin";
-- Check while role is being used for the permissions
SELECT "current_user"();

-- APPLY any DDL changes
CREATE TABLE "{schema name}"."{table name}"(id SERIAL);
SELECT * from pg_tables WHERE tablename = "{schema name}"."{table name}";
```

### Helpers

```sql
-- Logged in user
SELECT "session_user"();

-- User used for permissions when using SET ROLE
SELECT "current_user"();

-- View table owner
SELECT * from pg_tables WHERE tablename = '{table name}';
```
