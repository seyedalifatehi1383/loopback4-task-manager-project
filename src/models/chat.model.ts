import {Entity, model, property} from '@loopback/repository';

@model()
export class Chat extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  title?: string;

  @property({
    type: 'string',
    required: true,
  })
  text: string;

  @property({
    type: 'string',
  })
  group?: string;

  @property({
    type: 'string',
  })
  newUserId?: string;

  @property({
    type: 'string',
  })
  name: string;
  
  constructor(data?: Partial<Chat>) {
    super(data);
  }
}

export interface ChatRelations {
  // describe navigational properties here
}

export type ChatWithRelations = Chat & ChatRelations;
