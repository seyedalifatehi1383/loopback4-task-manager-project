import {authenticate, TokenService} from '@loopback/authentication';
import {
  // Credentials,
  MyUserService,
  TokenServiceBindings,
  // UserRepository,
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
    // @inject(SecurityBindings.USER, {optional: true})
    // public newUser: UserProfile,
    @repository(NewUserRepository) protected newUserRepository: NewUserRepository,
  ) {}


  @post('/signup', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              // 'x-ts-type': NewUser,
              exclude : ['realm' , 'verificationToken' , 'emailVerified' , 'id']
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
            partial : true,
            exclude : ['id']
          }),
        },
      },
    })
    newUserRequest: NewUser
  ): Promise<NewUser> {
    const password = await hash(newUserRequest.password, await genSalt());
    newUserRequest.password = password

    // const User = this.userService.convertToUserProfile(newUserRequest as any)
    // const token = await this.jwtService.generateToken(User)

    return await this.newUserRepository.create(
      _.omit(newUserRequest, 'realm' , 'verificationToken' , 'emailVerified')
    )  ;
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
    // const User =  this.userService.convertToUserProfile(newUser as any)
    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(newUser as any);
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
    @inject(SecurityBindings.USER as any)
    currentUserProfile: UserProfile,
    // newUser : NewUser
  ): Promise<any> {
    return currentUserProfile.email;
  }
}






