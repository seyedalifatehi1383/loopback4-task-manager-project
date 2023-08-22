import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  NewUser,
  Chat,
} from '../models';
import {NewUserRepository} from '../repositories';

import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';



@authenticate('jwt')
export class NewUserChatController {
  constructor(
    @repository(NewUserRepository) protected newUserRepository: NewUserRepository,
  ) { }

  @get('/new-users/{id}/chats', {
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
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Chat>,
  ): Promise<Chat[]> {
    return this.newUserRepository.chats(id).find(filter);
  }

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
    chat.name = currentUserProfile.name!
    return this.newUserRepository.chats(currentUserProfile[securityId]).create(chat);
    // return currentUserProfile.name
  }

  @patch('/new-users/{id}/chats', {
    responses: {
      '200': {
        description: 'NewUser.Chat PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chat, {partial: true}),
        },
      },
    })
    chat: Partial<Chat>,
    @param.query.object('where', getWhereSchemaFor(Chat)) where?: Where<Chat>,
  ): Promise<Count> {
    return this.newUserRepository.chats(id).patch(chat, where);
  }

  @del('/new-users/{id}/chats', {
    responses: {
      '200': {
        description: 'NewUser.Chat DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Chat)) where?: Where<Chat>,
  ): Promise<Count> {
    return this.newUserRepository.chats(id).delete(where);
  }
}
