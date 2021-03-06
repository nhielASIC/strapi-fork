'use strict';

const { pick } = require('lodash/fp');
const { ApplicationError } = require('@strapi/utils').errors;
const { validateUserCreationInput } = require('../validation/user');
const { getService } = require('../../../server/utils');

const pickUserCreationAttributes = pick(['firstname', 'lastname', 'email', 'roles']);

module.exports = {
  async create(ctx) {
    const { body } = ctx.request;

    await validateUserCreationInput(body);

    const attributes = pickUserCreationAttributes(body);
    const { useSSORegistration } = body;

    const userAlreadyExists = await getService('user').exists({ email: attributes.email });

    if (userAlreadyExists) {
      throw new ApplicationError('Email already taken');
    }

    if (useSSORegistration) {
      Object.assign(attributes, { registrationToken: null, isActive: true });
    }

    const createdUser = await getService('user').create(attributes);
    const userInfo = getService('user').sanitizeUser(createdUser);

    ctx.created({ data: userInfo });
  },
};
