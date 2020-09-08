'use strict';

const Pg = require('pg');
const args = require('larg')(process.argv.slice(2));
args.cmd = String(args._); // build cmd

(async function main () {
  // Init PG database
  const pg = new Pg.Client({
    host: '127.0.0.1', // env PGHOST
    user: undefined, // env PGUSER
    database: undefined, // env PGDATABASE
    password: undefined, // env PGPASSWORD
    ssl: false
  });
  await pg.connect();

  /**
   * CMD: setup-db
   * @arg --db=labs
   * @arg --schemas=dev,account
   */
  if (args.cmd == 'setup-db' && args.db && args.schemas) {
    // cast conversion
    args.schemas = args.schemas.split(',');
    return await require('./lib/setup-db')(args);
  }

  /**
   * CMD: setup-roles
   * @arg --db=labs
   * @arg --schemas=dev,account
   * @arg --readonly=labs_readonly
   * @arg --readwrite=labs_readwrite
   * @arg --admin=labs_admin
   */
  if (args.cmd == 'setup-roles' && args.db && args.schemas &&
      args.readonly && args.readwrite && args.admin) {
    // cast conversion
    args.schemas = args.schemas.split(',');
    return await require('./lib/setup-roles')(args);
  }

  /**
   * CMD: setup-user
   * @arg --user=labs_user1
   * @arg --grantRoles=labs_readonly,labs_readwrite
   */
  if (args.cmd == 'setup-user' && args.user && args.grantRoles) {
    // cast conversion
    args.grantRoles = args.grantRoles.split(',');
    return await require('./lib/setup-user')(args);
  }

  /**
   * CMD: get-privileges
   */
  if (args.cmd == 'get-privileges') {
    return await require('./lib/get-privileges')({ pg });
  }

  console.log(`Usage: ./ <command> <args>
  * setup-db --db --schemas
  * setup-roles --db --schemas --readonly --readwrite --admin
  * setup-user --user --grantRoles
  * get-privileges`);

  await pg.end();
})();
