'use strict';

const GRANTS = {
  readonly: ['SELECT'],
  readwrite: ['SELECT', 'INSERT', 'UPDATE'],
  admin: ['SELECT', 'INSERT', 'UPDATE', 'REFERENCES', 'TRIGGER', 'DELETE', 'TRUNCATE']
};

function createRole ({ db, schemas, role, grants, sequences = false }) {
  const sql = [`-- ======= Create role ${role} =======`];

  sql.push(`CREATE ROLE "${role}" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT NOLOGIN;`);

  // Grant connect on database
  sql.push(`GRANT CONNECT ON DATABASE "${db}" TO "${role}";`);

  // Grant usage on schemas
  schemas.forEach(function (schema) {
    // Grant usage on schema
    sql.push(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}";`);

    // Grant access to tables and views on the schema
    sql.push(`GRANT ${grants.toString()} ON ALL TABLES IN SCHEMA "${schema}" TO "${role}";`);
    // sql.push(`GRANT ${grants.toString()} ON ALL VIEWS IN SCHEMA "${schema}" TO "${role}";`);

    // To ensure that new tables and views are also accessible
    sql.push(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT ${grants.toString()} ON TABLES TO "${role}";`);
    // sql.push(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT ${grants.toString()} ON VIEWS TO "${role}";`);

    // Grant access to sequences
    if (sequences) {
      sql.push(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "${schema}" TO "${role}";`);
      sql.push(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT USAGE, SELECT ON SEQUENCES TO "${role}";`);
    }
  });
  return sql;
}

module.exports = async function ({ db, schemas = [], readonly, readwrite, admin }) {
  let sql = ['-- ======= Setup roles ======='];

  /**
   * Create readonly user
   */
  const sql1 = createRole({ db, schemas, role: readonly, grants: GRANTS.readonly });

  /**
   * Create readwrite user
   */
  const sql2 = createRole({ db, schemas, role: readwrite, grants: GRANTS.readwrite, sequences: true });

  /**
   * Create admin user
   */
  const sql3 = createRole({ db, schemas, role: admin, grants: GRANTS.admin, sequences: true });

  // Concat
  sql = sql.concat(sql1, sql2, sql3);
  console.log(sql.join('\n'));
  return sql;
};
