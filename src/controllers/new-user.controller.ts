import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';

import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';

import {
  TokenServiceBindings,
  MyUserService,
  UserServiceBindings,
  UserRepository,
  User,
  Credentials
} from '@loopback/authentication-jwt';

import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  SchemaObject,
  HttpErrors,
} from '@loopback/rest';
import {NewUser} from '../models';
import {NewUserRepository} from '../repositories';
import {TokenService} from '@loopback/authentication';
import {SecurityBindings, UserProfile ,securityId} from '@loopback/security';
import {genSalt, hash} from 'bcryptjs';
import _ from 'lodash';


// import {repository} from '@loopback/repository';





const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export class UserController {
  constructor(
    @repository(NewUserRepository)
    public newUserRepository : NewUserRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @repository(UserRepository) protected userRepository: UserRepository,
  ) {}




  @post('/signup', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: getModelSchemaRef(NewUser ,{
              // 'x-ts-type': User,
              exclude : ['realm' , 'password' , 'emailVerified' , 'verificationToken']
            }),

          },

        },
      },
    },
  })
  async signUp(
    // @requestBody({
    //   content: {
    //     'application/json': {
    //       schema: getModelSchemaRef(NewUser, {
    //         title: 'NewUser',

    //       }),
    //     },
    //   },
    // })
    @requestBody(CredentialsRequestBody) newUserRequest : Credentials
    // newUserRequest: NewUser,
  ): Promise<Credentials | object> {
    if (newUserRequest.password.length >7 && newUserRequest.email.endsWith('@gmail.com')) {
      const password = await hash(newUserRequest.password, await genSalt());
    const savedUser = await this.userRepository.create(
      _.omit(newUserRequest, 'realm' , 'password' , 'emailVerified' ,'verificationToken'),
    );

    await this.userRepository.userCredentials(savedUser.id).create({password});

    return savedUser;
    } else {
      throw new HttpErrors.Forbidden('email is not valid or password is weak')
    }
  }



  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<any> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);
    return {token };
  }



  @authenticate('jwt')
  @get('/whoAmI', {
    responses: {
      '200': {
        description: 'Return current user',
        content: {
          'application/json': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async whoAmI(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<string |undefined> {
    return currentUserProfile[securityId];
  }

  }
