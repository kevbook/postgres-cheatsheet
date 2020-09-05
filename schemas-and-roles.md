## Schemas

```
|-------------------------------------------|---|
| PostgreSQL instance                       |   |
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
- Users by default can only access objects in the schemas that they own. 
- If you do not explicitly specify a schema, `pubic` schema will be used (based on search path). The search path is a list of schema names that postgres checks when you don’t use a qualifier to the database object. 

```sql
# View the schemas search path
SHOW search_path; # "$user", public
```

```sql
# Create
CREATE SCHEMA "my_schema";

# Below two statements are the same (public schema is used by default) 
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
    has_schema_privilege(u.usename,s.schemaname,'create') AS user_has_select_permission,
    has_schema_privilege(u.usename,s.schemaname,'usage') AS user_has_usage_permission
FROM
    pg_user u
CROSS JOIN
    (SELECT DISTINCT schemaname FROM pg_tables) s
WHERE u.usename = 'myrole';
```











