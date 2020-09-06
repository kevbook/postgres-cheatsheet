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
# View the schemas search path
SHOW search_path; # "$user", public
```

```sql
# Create new schema
CREATE SCHEMA "my_schema";

# Below two statements are the same (public schema is used by default based on search path) 
CREATE TABLE "table_name"(id SERIAL);
CREATE TABLE "public"."table_name"(id SERIAL);
```

## Users and Roles

| Statement | Permission | Object | Role |  
| --------- | ---------- | ------ | ---- |
| GRANT     | SELECT, INSERT, UPDATE, DELETE, CREATE, ALL | ON (Object) | TO |
| REVOKE    | SELECT, INSERT, UPDATE, DELETE, CREATE, ALL | ON (Object) | FROM |

```sql
# Get list of users and roles
SELECT
  r.rolname, 
  ARRAY(SELECT b.rolname
    FROM pg_catalog.pg_auth_members m
    JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
    WHERE m.member = r.oid) as memberof
FROM pg_catalog.pg_roles r
WHERE r.rolname NOT IN ('pg_signal_backend','rds_iam',
                        'rds_replication','rds_superuser',
                        'rdsadmin','rdsrepladmin')
ORDER BY 1;

# Check object grants for a role
SELECT * FROM information_schema.role_usage_grants WHERE grantee = '{user}';
SELECT * FROM information_schema.role_table_grants WHERE grantee = '{user}';
SELECT * FROM information_schema.role_column_grants WHERE grantee = '{user}';
SELECT * FROM information_schema.role_routine_grants WHERE grantee = '{user}';
SELECT * FROM information_schema.role_udt_grants WHERE grantee = '{user}';


SELECT
  u.usename,
  s.schemaname,
  has_schema_privilege(u.usename,s.schemaname,'create') AS has_select_permission,
  has_schema_privilege(u.usename,s.schemaname,'usage') AS has_usage_permission
FROM pg_user u
CROSS JOIN (SELECT DISTINCT schemaname FROM pg_tables) s
  WHERE u.usename = 'myrole';
```

- You should create roles with specific sets of permissions, then assign the role to each user (instead of assigning permissions directly to the user).
- All new users and roles inherit permissions from the `PUBLIC` (`PUBLIC` is a group of all users and roles). Ie. It's grantd access to the `public` schema and the database (https://www.postgresql.org/docs/current/sql-grant.html). We should remove this default functionality. Users and roles should be granted the permissions explicitly. (https://aws.amazon.com/blogs/database/managing-postgresql-users-and-roles/)

```sql
# Revoke all access from PUBLIC
REVOKE ALL ON SCHEMA "public" FROM PUBLIC;
REVOKE ALL ON DATABASE "{database name}" FROM PUBLIC;
```

- Permissions to the role must be granted at the database, schema, and schema object level.
![](https://d2908q01vomqb2.cloudfront.net/887309d048beef83ad3eabf2a79a64a389ab1c9f/2019/03/01/managing-postgresql-users-3.gif)

```sql
# Create readonly role (inherits PUBLIC by default)
CREATE ROLE "labs_readonly" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOLOGIN;
GRANT CONNECT ON DATABASE "{database name}" TO "labs_readonly";
GRANT USAGE ON SCHEMA "{schema name}" TO "labs_readonly";

# To grant the readonly access to select tables and views
GRANT SELECT ON TABLE "mytable1", "mytable2" TO "labs_readonly";

# To grant the readonly access to all tables and views
GRANT SELECT ON ALL TABLES IN SCHEMA "{schema name}" TO "labs_readonly";

# Note that any new tables that get added in the future will not be accessible by the labs_readonly role
# To ensure that new tables and views are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema name}" GRANT SELECT ON TABLES TO "labs_readonly";
````
