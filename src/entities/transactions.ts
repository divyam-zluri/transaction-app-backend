import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({tableName : 'appData'})
export class Transaction {
  @PrimaryKey({type: 'serial'})
  id!: number; 

  @Property({ type: 'date' })
  date!: Date; 

  @Property()
  description!: string; 

  @Property({ type: 'float' })
  originalAmount!: number; 

  @Property()
  currency!: string; 

  @Property({ type: 'float' })
  amountInINR!: number;
}
