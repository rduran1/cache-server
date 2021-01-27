const { basename } = require('path');

const store = {
  hpsmIncidentService: {
    default: {
      host: 'defaultsbxserver',
      port: 123,
      username: 'rduran',
      password: 'sbxsecret'
    },
    dev: {
      host: 'devserver',
      port: 123,
      username: 'rduran',
      password: 'devsecret'
    }
  },
  tester: {
    default: {
      host: 'defaultsbxserver',
      port: 123,
      username: 'rduran',
      password: 'sbxsecret'
    },
    dev: {
      host: 'devserver',
      port: 123,
      username: 'rduran',
      password: 'devsecret'
    }
  }
};

function accountService(accountName) {
  const id = basename(accountName).split('.')[0];
  if (!Object.keys(store).includes(id)) throw new Error(`Account for "${id}" does not exist in store`);
  const account = store[id];

  return {
    getCreds: (env) => {
      if (typeof env === 'string') {
        if (!Object.keys(account).includes(env)) throw new Error(`Environment "${env}" for "${id}" does not exist in store`);
        return account[env];
      }
      return account['default'];
    }
  };
}

module.exports = accountService;