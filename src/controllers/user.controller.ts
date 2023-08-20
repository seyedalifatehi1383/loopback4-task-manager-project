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
  patch,
  post,
  requestBody,
  SchemaObject,
  response,
  param,
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
            exclude : ['id', 'realm' , 'emailVerified' ,'verificationToken' , 'accessLevel']
          }),
        },
      },
    })
    newUserRequest: NewUser
  ): Promise<NewUser> {
    if (newUserRequest.password.length >7 && newUserRequest.email.endsWith('@gmail.com')) {
      const password = await hash(newUserRequest.password, await genSalt());
      newUserRequest.accessLevel = "User"
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
    newUser : NewUser
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
  @authenticate('jwt')
  @patch('/increase/{id}')
  @response(200, {
    description: 'Task PATCH success count',
    content: {'application/json': {schema: {NewUser}}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUser,
            {
              partial: true,
              exclude : ['id','realm','username','email','emailVerified','verificationToken','password']
            }),
        },
      },
    })
    newUser: NewUser,
    @param.path.string('id') id :string,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    const check =  await this.newUserRepository.findById(currentUserProfile[securityId])
    // return check
    if (check.accessLevel == "Admin") {
      if (newUser.accessLevel == 'User') {
        newUser.accessLevel = 'User';
        this.newUserRepository.updateById(id,newUser);
        return newUser
      }

      else if (newUser.accessLevel == 'SubAdmin') {
        newUser.accessLevel = 'SubAdmin';
        this.newUserRepository.updateById(id,newUser);
        return newUser
      }

      else {
        throw new HttpErrors.Forbidden('there is no such an eminency')
      }
    } else {
      throw new HttpErrors.Forbidden('you are not admin')
    }
  }
}








