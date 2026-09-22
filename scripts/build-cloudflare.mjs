import { spawnSync } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(args, env = process.env) {
  const result = spawnSync(npm, args, { env, shell: process.platform === 'win32', stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (process.env.OPENNEXT_INNER_BUILD === '1') {
  run(['run', 'build:next'])
} else {
  run(['run', 'prepare:local-d1'])
  run(['exec', '--', 'opennextjs-cloudflare', 'build'], {
    ...process.env,
    OPENNEXT_INNER_BUILD: '1',
    PAYLOAD_BUILD_LOCAL: '1',
  })
}
