import {Entity, model, property} from '@loopback/repository';

@model()
export class NewUser extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  username: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;


  constructor(data?: Partial<NewUser>) {
    super(data);
  }
}

export interface NewUserRelations {
  // describe navigational properties here
}

export type NewUserWithRelations = NewUser & NewUserRelations;
