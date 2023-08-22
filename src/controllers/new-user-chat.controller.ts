import {
  Count,
  CountSchema,
  Entity,
  Filter,
  model,
  property,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {
  NewUser,
  Chat,
} from '../models';
import {NewUserRepository} from '../repositories';

import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {test} from 'node:test';
import _ from 'lodash';

// this model is for showing messages when delete method is processing
@model()
export class showMessageResponse extends Entity {
  @property({
    type: 'number'
  })
  id : number

  @property({
    type : 'string',
    required :true
  })
  name : string;

  @property({
    type : 'string',
    // required :true
  })
  title? : string;

  @property({
    type : 'string',
    required :true
  })
  text : string;

  @property({
    type : 'string',
    // require :true
  })
  group? : string;
}

@authenticate('jwt')
export class NewUserChatController {
  constructor(
    @repository(NewUserRepository) protected newUserRepository: NewUserRepository,
  ) { }

  // getting the history of a user messages
  @get('/new-users/chats-history', {
    responses: {
      '200': {
        description: 'Array of NewUser has many Chat',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Chat)},
          },
        },
      },
    },
  })
  async findAll(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Chat[]> {
    return this.newUserRepository.chats(currentUserProfile[securityId]).find();
  }

  // this method is for posting a chat
  @post('/new-users/chats', {
    responses: {
      '200': {
        description: 'NewUser model instance',
        content: {'application/json': {
          schema: getModelSchemaRef(Chat , {
              partial : true,
              exclude : ['newUserId']
            })
          }
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chat, {
            title: 'NewChatInNewUser',
            exclude: ['id' , 'newUserId' ,'name'],
          }),
        },
      },
    })
    chat: Omit<Chat, 'id'>,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    ): Promise<any> {
    chat.newUserId = currentUserProfile[securityId]
    // let showResponse: showMessageResponse
    chat.name = currentUserProfile.name!
    const response = await this.newUserRepository.chats(currentUserProfile[securityId]).create(chat);
    return _.omit(response, 'newUserId')
  }

  // this method is for that all of the members can edit one of their own messages
  @patch('/new-users/chats/{messageId}', {
    responses: {
      '200': {
        description: 'NewUser.Chat PATCH success count',
        content: {'application/json': {
          schema: getModelSchemaRef(Chat, {
            partial: true,
            exclude: ['newUserId']
          })
      }},
      },
    },
  })
  async patch(
    @param.path.number('messageId') messageId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chat, {
            partial: true,
            exclude: ['id', 'name', 'newUserId']
          }),
        },
      },
    })
    chat: Partial<Chat>,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    const count = (await this.newUserRepository.chats(currentUserProfile[securityId]).patch(chat , {id: messageId})).count
    const response = await this.newUserRepository.chats(currentUserProfile[securityId]).find({where : {id: messageId}})

    if (count == 0) {
      throw new HttpErrors.Forbidden('the entered id is not valid')
    }

    return _.omit(response[0], 'newUserId')
  }

  // this method is for that a member can delete his or her message
  @del('/new-users/chats/{messageId}', {
    responses: {
      '200': {
        description: 'NewUser.Chat DELETE success count',
        content: {'application/json': {schema: {String}}},
      },
    },
  })
  async delete(
    @param.path.number('messageId') messageId: number,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    const result = await this.newUserRepository.chats(currentUserProfile[securityId]).find({where: {id: messageId}})
    if (result.length == 0) {
      throw new HttpErrors.Forbidden('you cannot delete other users\' messages')
    }

    await this.newUserRepository.chats(currentUserProfile[securityId]).delete({id: messageId});
    return 'message was successfully deleted'
  }
}
