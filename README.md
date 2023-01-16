# @adminjs/sql

This is an official AdminJS adapter for SQL databases. It does not require you to use any ORMs, instead you just provide database connection and you model the data sources using AdminJS configuration.

Supported databases:
- PostgreSQL
- more coming soon

This adapter is heavily inspired by [wirekang's adminjs-sql](https://github.com/wirekang/adminjs-sql) which is an unofficial adapter for a MySQL database.

# Installation

```bash
$ yarn add @adminjs/sql
```

# Usage with Express

The example below shows usage with `@adminjs/express`. The usage of `Adapter` class is required to parse your database's schema.

```typescript
import AdminJS from 'adminjs'
import express from 'express'
import Plugin from '@adminjs/express'
import Adapter, { Database, Resource } from '@adminjs/sql'

AdminJS.registerAdapter({
  Database,
  Resource,
})

const start = async () => {
  const app = express()

  const db = await new Adapter('postgresql', {
    connectionString: '<your database connection string>', //  postgresql://[user]:[password]@[netloc]:[port]/[dbname]
    database: '<your database name>',
  }).init();

  const admin = new AdminJS({
    resources: [
      {
        resource: db.table('users'),
        options: { /* any resource options, rbac, etc */ },
      },
    ],
    // databases: [db] <- you can also provide the DB connection to register all tables at once
  });

  admin.watch()

  const router = Plugin.buildRouter(admin)

  app.use(admin.options.rootPath, router)

  app.listen(8080, () => {
    console.log('app started')
  })
}

start()
```

# Database Relations

Currently only `many-to-one` relation works out of the box if you specify foreign key constraints in your database. Other relations will require you to make UI/backend customizations. Please see our [documentation](https://docs.adminjs.co) to learn more.

# Enums

As of version `1.0.0` database enums aren't automatically detected and loaded. You can assign them manually in your resource options:

```typescript
// ...
  const admin = new AdminJS({
    resources: [{
      resource: db.table('users'),
      options: {
        properties: {
          role: {
            availableValues: [
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Client', value: 'CLIENT' },
            ],
          },
        },
      },
    }],
  })
// ...
```

# Timestamps

If your database tables have automatically default-set timestamps (`created_at`, `updated_at`, etc) they will be visible in create/edit forms by default. You can hide them in resource options:

```typescript
// ...
  const admin = new AdminJS({
    resources: [{
      resource: db.table('users'),
      options: {
        properties: {
          created_at: { isVisible: false },
        },
      },
    }],
  })
// ...
```

## License

AdminJS is copyrighted © 2023 rst.software. It is a free software, and may be redistributed under the terms specified in the [LICENSE](LICENSE.md) file.

## About rst.software

<img src="https://pbs.twimg.com/profile_images/1367119173604810752/dKVlj1YY_400x400.jpg" width=150>

We’re an open, friendly team that helps clients from all over the world to transform their businesses and create astonishing products.

* We are available for [hire](https://www.rst.software/estimate-your-project).
* If you want to work for us - check out the [career page](https://www.rst.software/join-us).
