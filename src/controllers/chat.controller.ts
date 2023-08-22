import {
  Count,
  CountSchema,
  Event,
  Filter,
  FilterExcludingWhere,
  model,
  property,
  repository,
  Where,
} from '@loopback/repository';
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
  HttpErrors,
} from '@loopback/rest';
import {Chat} from '../models';
import {ChatRepository , NewUserRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import { showMessageResponse } from "../controllers/new-user-chat.controller";
import {group} from 'node:console';
import {text} from 'stream/consumers';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';


@model()
export class delMessage{
  @property({
    type : 'string'
  })
  Message : string
}

@authenticate('jwt')
export class ChatController {
  constructor(
    @repository(ChatRepository)
    public chatRepository : ChatRepository,
    @repository(NewUserRepository)
    public NewUserRepository : NewUserRepository,
  ) {}

  // @post('/chats')
  // @response(200, {
  //   description: 'Chat model instance',
  //   content: {'application/json': {schema: getModelSchemaRef(Chat)}},
  // })
  // async create(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Chat, {
  //           title: 'NewChat',
  //           exclude: ['id'],
  //         }),
  //       },
  //     },
  //   })
  //   chat: Omit<Chat, 'id'>,
  // ): Promise<Chat> {
  //   return this.chatRepository.create(chat);
  // }

  @get('/chats/count')
  @response(200, {
    description: 'Chat model count that every user that logined can ',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Chat) where?: Where<Chat>,
  ): Promise<Count> {
    return this.chatRepository.count(where);
  }

  @get('/chats')
  @response(200, {
    description: 'Array of Chat model instances that every user that logined can use',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(showMessageResponse,
            {
              includeRelations: true
            }),
        },
      },
    },
  })
  async find(
    // @param.filter(Chat) filter?: Filter<Chat>,
  ): Promise<any> {
    const allMessage = await this.chatRepository.find() ;
    // let finalResualt : showMessageResponse[];
    const finalResualt = allMessage.map(obj => ({id : obj.id , title : obj.title! , text : obj.text, group : obj.group! , name : obj.name }))
    return finalResualt
  }

  // @patch('/chats')
  // @response(200, {
  //   description: 'Chat PATCH success count',
  //   content: {'application/json': {schema: CountSchema}},
  // })
  // async updateAll(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Chat, {partial: true}),
  //       },
  //     },
  //   })
  //   chat: Chat,
  //   @param.where(Chat) where?: Where<Chat>,
  // ): Promise<Count> {
  //   return this.chatRepository.updateAll(chat, where);
  // }

  @get('/chats/group/{MessageGroup}')
  @response(200, {
    description: 'Chat model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chat, {includeRelations: true}),
      },
    },
  })
  async findByGroup(

    @param.path.string('MessageGroup') MessageGroup: string,
    // @param.filter(Chat, {exclude: 'where'}) filter?: FilterExcludingWhere<Chat>
  ): Promise<any> {
    const messages = await this.chatRepository.find({where : {group : MessageGroup}})
    return messages.map(obj =>({id : obj.id , title : obj.title , text : obj.text , group : obj.group , name : obj.name}))
  }



  @get('/chats/text/{MessageText}')
  @response(200, {
    description: 'Chat model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chat, {includeRelations: true}),
      },
    },
  })
  async findByText(
    @param.path.string('MessageText') MessageText: string,
  ): Promise<any> {
    const messages = await this.chatRepository.find()
    return messages.filter(obj => (obj.text.includes(MessageText)))
  }

  // @patch('/chats/{id}')
  // @response(204, {
  //   description: 'Chat PATCH success',
  // })
  // async updateById(
  //   @param.path.number('id') id: number,
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Chat, {partial: true}),
  //       },
  //     },
  //   })
  //   chat: Chat,
  // ): Promise<void> {
  //   await this.chatRepository.updateById(id, chat);
  // }

  // @put('/chats/{id}')
  // @response(204, {
  //   description: 'Chat PUT success',
  // })
  // async replaceById(
  //   @param.path.number('id') id: number,
  //   @requestBody() chat: Chat,
  // ): Promise<void> {
  //   await this.chatRepository.replaceById(id, chat);
  // }

  @del('/chats/Admin/{MessageId}')
  @response(204, {
    description: 'this route need Admin access(only admin can delete the message of user\'s)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(delMessage, {includeRelations: true}),
      },
    },
  })

  async deleteById(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @param.path.number('MessageId') MessageId: number
    ): Promise<any> {
    const currentUser = await this.NewUserRepository.findById(currentUserProfile[securityId])
    if (currentUser.accessLevel == "Admin") {
      if (await this.chatRepository.findById(MessageId) == null) {
        throw new HttpErrors[404]
      } else {
        await this.chatRepository.deleteById(MessageId);
        return {Message : "this message deleted successfully"}
      }
    } else {
      throw new HttpErrors.Forbidden('just admin can delete other messages')
    }
  }
}
