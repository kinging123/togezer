const NodeEnvironment = require('jest-environment-node').TestEnvironment

class ExpoTestEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    // Set Expo environment variables
    this.global.__DEV__ = true
  }
}

module.exports = ExpoTestEnvironment
