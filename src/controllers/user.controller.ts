import {authenticate, TokenService} from '@loopback/authentication';
import {
  Credentials,
  MyUserService,
  TokenServiceBindings,
  UserRepository,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {model, property, repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  post,
  requestBody,
  SchemaObject,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {genSalt, hash} from 'bcryptjs';
import { NewUser } from "../models";
import { NewUserRepository } from "../repositories";
import _ from 'lodash';




export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @repository(NewUserRepository) protected newUserRepository: NewUserRepository,
  ) {}


  @post('/signup', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': NewUser,
            },
          },
        },
      },
    },
  })
  async signUp(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUser, {
            title: 'NewUser',
          }),
        },
      },
    })
    newUserRequest: NewUser,
  ): Promise<any> {
    const password = await hash(newUserRequest.password, await genSalt());
    newUserRequest.password = password
    const User = this.userService.convertToUserProfile(newUserRequest)
    const token = await this.jwtService.generateToken(User)

    return await this.newUserRepository.create(newUserRequest) , token ;
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
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUser, {
            title: 'NewUser',
          }),
        },
      },
    })
    newUser : NewUser
  ): Promise<{token: string}> {
    // // ensure the user exists, and the password is correct
    // const user = await this.userService.verifyCredentials(newUser);
    // // convert a User object into a UserProfile object (reduced set of properties)
    // const userProfile = this.userService.convertToUserProfile(user);
    const User =  this.userService.convertToUserProfile(newUser)
    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(User);
    return {token};
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
  ): Promise<string | undefined> {
    return currentUserProfile.name;
  }
}






