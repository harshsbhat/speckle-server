/* istanbul ignore file */
/**
 * Bootstrap module that should be imported at the very top of each entry point module
 */

// Conditionally change appRoot and packageRoot according to whether we're running from /dist/ or not (ts-node)
const path = require('path')
const isTsNode = !!process[Symbol.for('ts-node.register.instance')]
const appRoot = __dirname
const packageRoot = isTsNode ? appRoot : path.resolve(__dirname, '../')

// Initializing module aliases for absolute import paths
const moduleAlias = require('module-alias')
moduleAlias.addAliases({
  '@': appRoot,
  '#': packageRoot
})

// Initializing env vars
const dotenv = require('dotenv')
const {
  isTestEnv,
  isApolloMonitoringEnabled,
  getApolloServerVersion,
  getServerVersion,
  isDevEnv
} = require('@/modules/shared/helpers/envHelper')
const { logger } = require('@/observability/logging')

if (isApolloMonitoringEnabled() && !getApolloServerVersion()) {
  process.env.APOLLO_SERVER_USER_VERSION = getServerVersion()
}

// If running in test env, load .env.test first
// (appRoot necessary, cause env files aren't loaded through require() calls)
if (isTestEnv()) {
  const { error } = dotenv.config({ path: `${packageRoot}/.env.test` })
  if (error) {
    const e = new Error(
      'Attempting to run tests without an .env.test file properly set up! Check readme!'
    )
    logger.error(e)
    process.exit(1)
  }
}

// Custom inspector init, when debugging doesn't work any other way
// (e.g. due to various child processes capturing the --inspect flag)
const startDebugger = process.env.START_DEBUGGER
if ((isTestEnv() || isDevEnv()) && startDebugger) {
  const inspector = require('node:inspector')
  if (!inspector.url()) {
    console.log('Debugger starting on process ' + process.pid)
    inspector.open(0, undefined, true)
  }
}

dotenv.config({ path: `${packageRoot}/.env` })

// knex is a singleton controlled by module so can't wait til app init
const { initOpenTelemetry } = require('@/observability/otel')
initOpenTelemetry()

const { patchKnex } = require('@/modules/core/patches/knex')
patchKnex()

module.exports = {
  appRoot,
  packageRoot
}
