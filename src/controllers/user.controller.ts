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
  del,
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


@model()
export class deletUserResponse  {
  @property({
    type : 'string',
    require :true
  })
  message :string;
}



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
            title: 'login',
            partial : true,
            exclude : ['accessLevel','username' ,'id', 'realm' , 'emailVerified' ,'verificationToken' ]
          }),
        },
      },
    })
    // @requestBody()
    newUser : NewUser
  ): Promise<any> {
    // ensure the user exists, and the password is correct
    const user = await this.newUserRepository.findOne({where : {email : newUser.email , password : newUser.password}})
    // convert a User object into a UserProfile object (reduced set of properties)
  if (user === null) {
  throw new HttpErrors.NotFound('email or password is wrong')
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
            schema: getModelSchemaRef(NewUser ,{
              // type: 'string',
              partial: true,
              exclude: ['realm', 'emailVerified', 'verificationToken', 'password']
            })
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
    const user = await this.newUserRepository.findById(currentUserProfile[securityId])
    return _.omit(user, 'realm', 'emailVerified', 'verificationToken', 'password');
  }

  @authenticate('jwt')
  @patch('/changeEminency/{id}')
  @response(200, {
    description: 'Task PATCH success count',
    content: {'application/json': {schema: {NewUser}}},
  })
  async updateId(
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
        const user = await this.newUserRepository.findById(id)
        if (user.accessLevel == 'User') {
          throw new HttpErrors.Conflict('this user\'s eminency is already User')
        } else {

          user.accessLevel = 'User';
          await this.newUserRepository.updateById(id,newUser);
          return {username : user.username , accessLevel : user.accessLevel}
        }
      }

      else if (newUser.accessLevel == 'SubAdmin') {
        const user = await this.newUserRepository.findById(id)
        if (user.accessLevel == 'SubAdmin') {
          throw new HttpErrors.Conflict('this user\'s eminency is already SubAdmin')
        } else {

          user.accessLevel = 'SubAdmin';
          await this.newUserRepository.updateById(id,newUser);
          return {username : user.username , accessLevel : user.accessLevel}
        }
      }

      else {
        throw new HttpErrors.Forbidden('there is no such an eminency')
      }
    } else {
      throw new HttpErrors.Forbidden('you are not admin')
    }
  }


  @authenticate('jwt')
  @get('/showUsers', {
    responses: {
      '200': {
        description: 'Return current user',
        content: {
          'application/json': {
            schema: getModelSchemaRef(NewUser ,{
              // type: 'string',
              partial: true,
              exclude: ['realm' , 'emailVerified' ,'verificationToken' , 'password']
            })
          },
        },
      },
    },
  })
  async showUsers(
    // newUser : Omit<NewUser, 'realm' | 'emailVerified' | 'verificationToken' | 'password'>
  ): Promise<any> {
    const user = await this.newUserRepository.find({where: {accessLevel: "User"}})
    // const user = await this.newUserRepository.find()
    // return _.omit(user, 'realm', 'emailVerified', 'verificationToken', 'password');
    return user.map(obj => ({id: obj.id, username: obj.username, email: obj.email , accessLevel : obj.accessLevel}));
  }

  @authenticate('jwt')
  @get('/showSubAdmin', {
    responses: {
      '200': {
        description: 'Return current user',
        content: {
          'application/json': {
            schema: getModelSchemaRef(NewUser ,{
              // type: 'string',
              partial: true,
              exclude: ['realm' , 'emailVerified' ,'verificationToken' , 'password']
            })
          },
        },
      },
    },
  })
  async showSubAdmin(
    // newUser : Omit<NewUser, 'realm' | 'emailVerified' | 'verificationToken' | 'password'>
  ): Promise<any> {
    const user = await this.newUserRepository.find({where: {accessLevel: "SubAdmin"}})
    // const user = await this.newUserRepository.find()
    // return _.omit(user, 'realm', 'emailVerified', 'verificationToken', 'password');
    return user.map(obj => ({id: obj.id, username: obj.username, email: obj.email , accessLevel : obj.accessLevel}));
  }

  @authenticate('jwt')
  @del('/deleteAccount', {
    responses: {
      '200': {
        description: 'NewUser.Task DELETE user was success',
        content: {'application/json': {
          schema: getModelSchemaRef(deletUserResponse , {
            title : "New-user",
            partial : true
          })
        }},
      },
    },


  })
  async delete(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
      const targetUser = this.newUserRepository.findById(currentUserProfile[securityId])
      if (targetUser !== null) {
        await this.newUserRepository.deleteById(currentUserProfile[securityId])
        return {message : "your account has been deleted successfully"}
      } else {
        // return targetUser
        throw new HttpErrors[404]
      }
    // return currentUserProfile[securityId]
  }
}








