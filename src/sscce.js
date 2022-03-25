'use strict';

// Require the necessary things from Sequelize
const { Sequelize, Op, Model, DataTypes } = require('sequelize');

// This function should be used instead of `new Sequelize()`.
// It applies the config for your SSCCE to work on CI.
const createSequelizeInstance = require('./utils/create-sequelize-instance');

// This is an utility logger that should be preferred over `console.log()`.
const log = require('./utils/log');

// You can use sinon and chai assertions directly in your SSCCE if you want.
const sinon = require('sinon');
const { expect } = require('chai');

// Your SSCCE goes inside this function.
module.exports = async function() {
  const sequelize = createSequelizeInstance({
    logQueryParameters: true,
    benchmark: true,
    define: {
      timestamps: false // For less clutter in the SSCCE
    }
  });

  const Foo = sequelize.define('Foo', { username: DataTypes.STRING });

  Foo.findByUsername = async (username) => {
    let foo = await Foo.findOne({
      where: {
        username: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('username')),
          '=',
          sequelize.fn('LOWER', username)
        ),
      },
    });
    return foo;
  };

  const username1 = 'money'
  const username2 = 'money$'

  const spy = sinon.spy();
  sequelize.afterBulkSync(() => spy());
  await sequelize.sync();
  expect(spy).to.have.been.called;

  log(await Foo.create({ username: username1 }));
  log(await Foo.create({ username: username2 }));
  expect(await Foo.count()).to.equal(2);
  const foundFoo1 = await Foo.findByUsername(username1)
  const foundFoo2 = await Foo.findByUsername(username2)
  
  // the model without a $ in username is returned 
  expect(typeof foundFoo1).to.equal('object')
  // this test fails because the $ sign is being escaped incorrectly
  expect(foundFoo2).to.not.be.null
};
