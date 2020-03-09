import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: (process.env.TYPEORM_CONNECTION) as any,
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    migrations: process.env.TYPEORM_MIGRATIONS.split(','),
    entities: process.env.TYPEORM_ENTITIES.split(','),
    autoLoadEntities: true
};
