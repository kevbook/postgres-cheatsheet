'use strict';

module.exports = async function ({ user, grantRoles = [] }) {
  const sql = ['-- ======= Setup user ======='];
  const pass = Math.random().toString(36).substring(4);

  /**
   * Create user
   */
  sql.push(`CREATE USER "${user}" WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT LOGIN PASSWORD '${pass}';`);

  /**
   * Grant roles to user
   */
  grantRoles.forEach(function (role) {
    sql.push(`GRANT "${role}" TO "${user}";`);
  });

  console.log(sql.join('\n'));
  return sql;
};
