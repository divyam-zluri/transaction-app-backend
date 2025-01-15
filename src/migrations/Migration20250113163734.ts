import { Migration } from '@mikro-orm/migrations';

export class Migration20250113163734 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "appData" add column "is_deleted" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "appData" drop column "is_deleted";`);
  }

}
