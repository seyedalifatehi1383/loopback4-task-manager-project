import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
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
} from '@loopback/rest';
import {Chat} from '../models';
import {ChatRepository} from '../repositories';

export class ChatController {
  constructor(
    @repository(ChatRepository)
    public chatRepository : ChatRepository,
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
    description: 'Chat model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Chat) where?: Where<Chat>,
  ): Promise<Count> {
    return this.chatRepository.count(where);
  }

  @get('/chats')
  @response(200, {
    description: 'Array of Chat model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Chat, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    // @param.filter(Chat) filter?: Filter<Chat>,
  ): Promise<Chat[]> {
    return this.chatRepository.find();
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

  @get('/chats/{id}')
  @response(200, {
    description: 'Chat model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chat, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Chat, {exclude: 'where'}) filter?: FilterExcludingWhere<Chat>
  ): Promise<Chat> {
    return this.chatRepository.findById(id, filter);
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

  @del('/chats/{id}')
  @response(204, {
    description: 'Chat DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.chatRepository.deleteById(id);
  }
}
