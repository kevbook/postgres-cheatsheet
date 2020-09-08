'use strict';

module.exports = async function ({ db, schemas = [] }) {
  const sql = ['-- ======= Setup db and schemas ======='];

  /**
   * Create db
   */
  sql.push(`CREATE DATABASE IF NOT EXISTS "${db}";`);

  /**
   * Create schemas
   */
  schemas.forEach(function (schema) {
    sql.push(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
  });

  /**
   * Revoke all access from PUBLIC
   */
  sql.push('REVOKE ALL ON SCHEMA "public" FROM PUBLIC;');
  sql.push(`REVOKE ALL ON DATABASE "${db}" FROM PUBLIC;`);

  console.log(sql.join('\n'));
  return sql;
};
