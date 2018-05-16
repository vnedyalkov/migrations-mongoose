const migrations = require('../migration');

const dbpath = 'mongodb://localhost:4001/test';
const migrationCollection = 'migrations';

const migrator = new migrations(dbpath, migrationCollection);

migrator.add({
    version: 1,
    name: 'log hello',
    up: ()=>{
        setTimeout(()=>{
            console.log('hello');
        }, 2000)
    }
});

migrator.add({
    version: 2,
    name: 'log world',
    up: ()=>{
        setTimeout(()=>{
            console.log('world');
        }, 1000)
    }
});


migrator.migrate();