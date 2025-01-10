import { Migration } from '@mikro-orm/migrations';

export class Migration20250110085332 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "appData" alter column "description" type varchar(500) using ("description"::varchar(500));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "appData" alter column "description" type varchar(255) using ("description"::varchar(255));`);
  }

}
