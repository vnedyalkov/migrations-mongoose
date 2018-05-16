# migrations-mongoose
Mongoose extension for server-side migrations. Тhis add-on allows to safely execute portions of the code, while retaining the current version of the migration and blocking subsequent migrations on error.

## Installation

```sh
$ npm install migrations-mongoose -save
```

or include it in `package.json`

## Usage

In order to use mongoose you need running mongodb database and empty collection in which we will keep track of migrations:

```js
const dbpath = 'mongodb://localhost:4001/mydb';
const migrationCollection = 'migrations';
```

Next step is to create migration object:

```js
const Migrator = require('migrations-mongoose');

const dbpath = 'mongodb://localhost:4001/mydb';
const migrationCollection = 'migrations';

const migrator = new Migrator(dbpath, migrationCollection);
```

Then we can add some migrations:

```js
const Migrator = require('migrations-mongoose');

const dbpath = 'mongodb://localhost:4001/mydb';
const migrationCollection = 'migrations';

const migrator = new Migrator(dbpath, migrationCollection);

migrator.add({
    version: 1,
    name: 'Create Initial Admin User',
    up: ()=>{
        // Logic to create your admin user
        // example
        let admin = new Admin();
        admin.save((err, admin) => {
           console.log("admin created.");
        })
    }
});

migrator.add({
    version: 2,
    name: 'Add additional field role to my admin user',
    up: ()=>{
        // Logic add aditional field to your admin
        // example
        Admin.findOne({}, (err, admin) => {
            admin.role = "super admin";
            admin.save((err, admin) => {
               console.log("admin updated.");
            })
        });
    }
});
```

So far so good. Now we have two options to run the migrations:

### Option 1:

This option will run only migration "version 1" and will set migration version to "1".

```js
migrator.migrateTo(1);
```

### Option 2:

This option will trigger all migration to latest version.

```js
migrator.migrate();
```

For example: If you run migrate(). This will execute both migrations. In later stage if you add 1 more additional migration "version 3". Only "version 3" will be execute.

```
Note: I recommend not to use both options at once
```

## On error occur

Ff some kind of error occur while migration is executed, migrations will be locked and you won't be able to run them again. The purpose of this is to prevent unwanted changes to the database.

```
Solution: In order to unlock migrations again, you have to change migration document property locked from 'true' to 'false' into your collection, manualy. In this case collection is named 'migrations', so you need to change document property in this collection.
```

## License

MIT License

Copyright (c) 2018 Vasil Nedyalkov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


