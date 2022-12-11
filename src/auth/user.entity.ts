import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  userid: string;

  @Column()
  username: string;

  @Column()
  password: string;
}
