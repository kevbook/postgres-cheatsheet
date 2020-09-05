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

## Users / Roles

| Statement | Permission | Object | Role |  
| --------- | ---------- | ------ | ---- |
| GRANT     | SELECT, INSERT, UPDATE, DELETE, CREATE, ALL | ON (Object) | TO |
| REVOKE    | SELECT, INSERT, UPDATE, DELETE, CREATE, ALL | ON (Object) | FROM |
| SHOW      | 

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
SELECT * FROM information_schema.role_table_grants WHERE grantee = '{}';
SELECT * FROM information_schema.role_usage_grants WHERE grantee = '{}';
SELECT * FROM information_schema.role_column_grants WHERE grantee = '{}';
SELECT * FROM information_schema.role_routine_grants WHERE grantee = '{}';
SELECT * FROM information_schema.role_udt_grants WHERE grantee = '{}';


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
- All new users and roles inherit permissions from the `PUBLIC` role. ie. Access to the `public` schema (and also the database itself) (https://www.postgresql.org/docs/current/sql-grant.html). We should remove this default functionality. Users and roles should be granted the permissions explicitly.

```sql

REVOKE ALL ON SCHEMA public FROM PUBLIC;

REVOKE ALL ON SCHEMA public FROM PUBLIC;

Similarly it also gives permission on database level, to remove use

REVOKE ALL ON DATABASE all_database FROM PUBLIC;



# Create base role (inherits public role by default)
CREATE ROLE "labs_readonly" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOLOGIN;

GRANT CONNECT ON DATABASE "labs" TO "labs_readonly";
GRANT USAGE ON SCHEMA "myapp" TO "labs_readonly";


LOGIN PASSWORD 'secret_passwd';




CREATE ROLE myrole

CREATE ROLE myuser WITH LOGIN PASSWORD 'secret_passwd';

CREATE ROLE username NOINHERIT LOGIN PASSWORD password;


Both of these statements create the exact same user. This new user does not have any permissions other than the 

default permissions available to the public role. All new users and roles inherit permissions from the public role. The following section provides more details about the public role.



Use the master user to create roles per application or use case, like readonly and readwrite.
Add permissions to allow these roles to access various database objects. For example, the readonly role can only run SELECT queries.
Grant the roles the least possible permissions required for the functionality.
Create new users for each application or distinct functionality, like app_user and reporting_user.
Assign the applicable roles to these users to quickly grant them the same permissions as the role. For example, grant the readwrite role to app_user and grant the readonly role to reporting_user.
At any time, you can remove the role from the user in order to revoke the permissions.



```sql
# Grants
GRANT USAGE ON SCHEMA schema_name TO user_name;
```

