import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: '82.125.211.136',
    username: 'test',
    password: '1234',
    database: 'boxTest',
    port: 5432,
    migrations: [],
    entities: ['../entities/gen.entities/*.{js,ts}', '../**/entities/*.{js,ts}']
    // ,
    //  process.env.TYPEORM_PASSWORD,
    //  process.env.TYPEORM_PASSWORD,
    //  process.env.TYPEORM_PASSWORD,
    //  process.env.TYPEORM_PASSWORD
};

// TYPEORM_HOST = 82.125.211.136
// TYPEORM_CONNECTION = postgres
// TYPEORM_PORT = 5432
// TYPEORM_USERNAME = test
// TYPEORM_PASSWORD = 1234
// TYPEORM_DATABASE = boxTest

// TYPEORM_ENTITIES = dist/**/entities/*.js,dist/entities/gen.entities/*.js,
// TYPEORM_SUBSCRIBERS = dist/subscriber/*.js
// TYPEORM_MIGRATIONS = dist/database/migrations/*.js
// TYPEORM_ENTITIES_DIR = src/**/entities,src/entities/gen.entities
// TYPEORM_MIGRATIONS_DIR = src/database/migrations
// TYPEORM_SUBSCRIBERS_DIR = src/**/subscriber