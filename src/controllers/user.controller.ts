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
  HttpErrors,
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
            schema: getModelSchemaRef(NewUser,{
              // 'x-ts-type': NewUser,
              exclude : ['realm' , 'verificationToken' , 'emailVerified' , 'id']
            },)
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
            exclude : ['id', 'realm' , 'emailVerified' ,'verificationToken' ]
          }),
        },
      },
    })
    newUserRequest: NewUser
  ): Promise<NewUser> {
    if (newUserRequest.password.length >7 && newUserRequest.email.endsWith('@gmail.com')) {
      const password = await hash(newUserRequest.password, await genSalt());
    const savedUser = await this.newUserRepository.create(
      _.omit(newUserRequest, 'realm'  , 'emailVerified' ,'verificationToken'),
    );

    // await this.newUserRepository.userCredentials(savedUser.id).create({password});

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
              exclude : ['realm' , 'verificationToken' , 'emailVerified' , 'id'],
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
            partial : true,
            exclude : ['accessLevel']
          }),
        },
      },
    })
    newUser : Omit<NewUser ,'accessLevel' >
  ): Promise<any> {
    // ensure the user exists, and the password is correct
    const user = await this.newUserRepository.findOne({where : {email : newUser.email}})
    // convert a User object into a UserProfile object (reduced set of properties)
if (user === null) {
  throw new HttpErrors.NotFound('there is no such user')
} else {
  const userProfile = this.userService.convertToUserProfile(user);
  // // create a JSON Web Token based on the user profile
  const token = await this.jwtService.generateToken(userProfile);
  // return {token };
  return {token}

}
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
    // newUser : NewUser
  ): Promise<any> {
    return currentUserProfile;
  }
}






