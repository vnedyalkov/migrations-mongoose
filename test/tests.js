const chai = require('chai');
const migrations = require('../migration');

const dbpath = 'mongodb://localhost:4001/test';
const migrationCollection = 'migrations';

describe('mongoose-migrations', () => {
    it('should create migrator instance', () => {
        let migrator = new migrations(dbpath, migrationCollection);
        chai.expect(migrator).to.be.an('object');
    });

    it('should contain property migratoions of type array', () => {
        let migrator = new migrations(dbpath, migrationCollection);
        chai.expect(migrator.migrations).to.be.an('array');
    });

    it('should has method add', () => {
        let migrator = new migrations(dbpath, migrationCollection);
        chai.expect(migrator.add).to.be.an('function');
    });

    it('should throw error when try to add migration with whrong params {version: Number}', () => {
        let migrator = new migrations(dbpath, migrationCollection);
        
        try {
            migrator.add({
                name:'test',
                up: ()=>{
    
                }
            });
        } catch (error) {
            chai.expect(error).to.not.be.null;
        }
    });

    it('should throw error when try to add migration with whrong params {up: Function}', () => {
        let migrator = new migrations(dbpath, migrationCollection);

        var err = new Error('MongooseMigration: Version is required');
        
        try {
            migrator.add({
                version:1,
                name:'test',
                up: 'test'
            });
        } catch (error) {
            chai.expect(error).to.not.be.null;
        }
    });

    it('should add 2 migrations to pending migrations', () => {
        let migrator = new migrations(dbpath, migrationCollection);

        migrator.add({
            version:1,
            name:'test',
            up: ()=>{
                console.log('Hello')
            }
        });

        migrator.add({
            version:2,
            name:'test',
            up: ()=>{
                console.log('World')
            }
        });

        chai.expect(migrator.migrations.length).to.equal(2);
    });

    it('should throw error when try to migrateTo whrong index', () => {
        let migrator = new migrations(dbpath, migrationCollection);

        migrator.add({
            version: 1,
            name:'test',
            up: ()=>{

            }
        });
        
        try {
            migrator.migrateTo(10);
        } catch (error) {
            chai.expect(error).to.not.be.null;
        }
    });
})