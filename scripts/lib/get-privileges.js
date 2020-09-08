'use strict';

const _ = require('lodash');

/**
 * https://www.postgresql.org/docs/current/functions-info.html
 */
const GRANTS = {
  DATABASE: ['CONNECT', 'CREATE', 'TEMPORARY'],
  SCHEMA: ['CREATE', 'USAGE'],
  TABLE: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'],
  VIEW: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'],
  SEQUENCE: ['USAGE', 'SELECT', 'UPDATE']
};

/**
 * Process data
 * @action {String} filter|include
 * @actionArr {Array}
 */
function processData ({ data, key, action, actionArr }) {
  // Make sure actionArr is in consistent format
  if (actionArr.toString().includes('[object Object]') === false) {
    actionArr = actionArr.map(function (i) {
      return { [key]: i };
    });
  }
  return data.filter(function (i) {
    if (action === 'include') return !!_.find(actionArr, [key, i[key]]);
    else { return !_.find(actionArr, [key, i[key]]); }
  });
}

module.exports = async function ({ pg }) {
  let result;
  const privileges = {};

  /**
   * Get database
   */
  result = await pg.query('SELECT current_database() AS db_name;');
  privileges.db = result.rows[0];

  /**
   * Get schemas & filter schemas
   */
  result = await pg.query(`SELECT oid AS schema_oid, nspname AS schema_name, nspowner AS owner
    FROM pg_catalog.pg_namespace;`);

  privileges.schemas = processData({
    data: result.rows,
    key: 'schema_name',
    action: 'filter',
    actionArr: ['information_schema', 'pg_catalog', 'pg_toast', 'pg_toast_temp_1', 'pg_temp_1']
  });

  /**
   * Get roles & filter roles
   */
  result = await pg.query(`SELECT oid, rolname AS role_name, rolsuper AS superuser,
    rolinherit AS inherit, rolcreaterole AS create_role, rolcreatedb AS create_db,
    rolcanlogin AS can_login, rolreplication AS replication, rolconnlimit as conn_limit,
    rolbypassrls as bypass_rls FROM pg_catalog.pg_roles;`);

  privileges.roles = processData({
    data: result.rows,
    key: 'role_name',
    action: 'filter',
    actionArr: ['pg_signal_backend', 'pg_read_all_settings', 'pg_read_all_stats', 'pg_stat_scan_tables',
      'pg_monitor', 'pg_read_server_files', 'pg_write_server_files', 'pg_execute_server_program',
      'rds_iam', 'rds_replication', 'rds_superuser', 'rdsadmin', 'rdsrepladmin'
    ]
  });

  /**
   * Get role memberships (relationships between roles)
   */
  result = await pg.query(`SELECT roleid AS role_oid, member AS member_oid,
    grantor AS grantor_oid, admin_option FROM pg_catalog.pg_auth_members;`);

  const memberships = result.rows;

  /**
   * Build roles map
   */
  const rolesMap = _.chain(privileges.roles)
    .mapKeys(function (value) { return value.oid; })
    .mapValues(function (value) { return value.role_name; })
    .valueOf();

  /**
   * Combine role and memberships
   */
  privileges.roles.forEach(function (role) {
    // Extract from memberships
    role.members_of = _.chain(memberships)
      // https://lodash.com/docs/4.17.15#filter
      .filter(['member_oid', role.oid])
      .map(function (m) {
        return {
          admin_option: m.admin_option,
          grantor: rolesMap[m.grantor_oid],
          granted: rolesMap[m.role_oid]
        };
      })
      .valueOf();
  });

  /**
   * Get tables and include only privileges.schemas
   * https://www.postgresql.org/message-id/hh1us5$4pk$1@news.hub.org
   */
  result = await pg.query(`SELECT schemaname AS schema_name, tablename AS table_name, tableowner AS owner
    FROM pg_catalog.pg_tables;`);

  privileges.tables = processData({
    data: result.rows,
    key: 'schema_name',
    action: 'include',
    actionArr: privileges.schemas
  });

  /**
   * Get views and include only privileges.schemas
   */
  result = await pg.query(`SELECT schemaname AS schema_name, viewname AS view_name, viewowner AS owner
    FROM pg_catalog.pg_views;`);

  privileges.views = processData({
    data: result.rows,
    key: 'schema_name',
    action: 'include',
    actionArr: privileges.schemas
  });

  /**
   * Get sequences and include only privileges.schemas
   */
  result = await pg.query(`SELECT oid AS sequence_oid, relname AS sequence_name, relnamespace as schema_oid,
    relowner as owner_oid FROM pg_catalog.pg_class WHERE relkind = \'S\';`);

  privileges.sequences = processData({
    data: result.rows,
    key: 'schema_oid',
    action: 'include',
    actionArr: privileges.schemas
  });

  console.log(privileges);
};
