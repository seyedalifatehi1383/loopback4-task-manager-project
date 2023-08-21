import {Entity, model, property, hasMany} from '@loopback/repository';
import { User } from "@loopback/authentication-jwt";
import {Task} from './task.model';
import {Chat} from './chat.model';

@model()
export class NewUser extends User {

  // @property({
  //   type: 'number',
  @hasMany(() => Task)
  tasks: Task[];

  @hasMany(() => Chat)
  chats: Chat[];
  //   id: true,
  //   generated: true,
  // })
  // id: number;

  // @property({
  //   type: 'string',
  //   required: true,
  // })
  // username: string;


  // @property({
  //   type: 'string',
  //   required: true,
  // })
  // email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'string',
    required: true,
  })
  accessLevel: string;


  constructor(data?: Partial<NewUser>) {
    super(data);
  }
}

export interface NewUserRelations {
  // describe navigational properties here
}

export type NewUserWithRelations = NewUser & NewUserRelations;
