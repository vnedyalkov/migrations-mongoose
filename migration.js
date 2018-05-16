const mongoose = require('mongoose');
const Sequence = require('./lib/sequence');
const errorMessages = require('./lib/error-messages');

/**
 * Mongoose Migrations
 */
class Migrations{
    constructor(dbpath, migrationCollection){
        this.connection = dbpath;
        this.migrations = [];
        this.migrationCollection = migrationCollection;
        this.migrationModel = {
            connection: this.connection,
            migrationCollection: this.migrationCollection
        };
    }

    //getters
    get connection(){
        return this._connection;
    }
    get migrations(){
        return this._migrations;
    }
    get migrationModel(){
        return this._migrationModel;
    }
    get migrationCollection(){
        return this._migrationCollection;
    }

    //setters
    set connection(dbpath){
        this._connection = mongoose.createConnection(dbpath);
    }
    set migrations(val){
        this._migrations = val;
    }
    set migrationModel(args){
        this._migrationModel = args.connection.model(args.migrationCollection, new mongoose.Schema({
            version : { type : Number },
            locked : {
                type: Boolean,
                default: false
            }
        }));
    }
    set migrationCollection(migrationCollection){
        this._migrationCollection = migrationCollection;
    }

    /**
     * Add migration to list of pending or executed migrations
     * @param {object} args 
     */
    add(args){
        if(!args)
            throw new Error(`MongooseMigration: ${errorMessages.noArguments}`);
        
        if(!args.version || !Number.isInteger(args.version))
            throw new Error(`MongooseMigration: ${errorMessages.versionRequired}`);
        
        if(args.version <= 0)
            throw new Error(`MongooseMigration: ${errorMessages.versionArgument}`);

        if(!args.up && typeof args.up !== 'function')
            throw new Error(`MongooseMigration: ${errorMessages.upRequired}`);

        this.migrations.push(args);
    }

    /**
     * Migrate db to latest migration added
     */
    migrate(){
        const sequencer = Sequence();
        let mgr;

        sequencer
            .chain(seq => {
                this.migrationModel.findOne({ }, (err, migration) => {
                    if(!migration){
                        let newMigration = new this.migrationModel;
                        newMigration.version = 0;
                        newMigration.save((err, migration) => {
                            if(err)
                                return seq.reject();
                            
                            mgr = migration;
                            return seq.resolve();
                        })
                    }else{
                        mgr = migration;
                        return seq.resolve();
                    }  
                })
            });
            
        sequencer
            .chain(seq => {
                if(mgr.locked){
                    console.warn(`MongooseMigration: Migrations are locked at version: ${mgr.version}`);
                    return seq.reject();
                }

                return seq.resolve();
            });

        sequencer
            .chain(seq => {
                let pendingMigrations = this.migrations.filter(mig => {
                    return mig.version > mgr.version;
                }).sort((a, b) => {
                    return a.version - b.version;
                });

                const innerSequencer = Sequence();

                pendingMigrations.forEach(pendMig => {
                    innerSequencer.chain(seq => {
                        let error = null;
            
                        try {  
                            pendMig.up();
                        }  
                        catch(exception){  
                            error =  exception;
                        }  
                        finally {
                            if(error){
                                this.migrationModel.findOne({ _id:mgr._id }, (err, migration) => {
                                    migration.locked = true;

                                    migration.save((err, updatedMigration) => {
                                        mgr = updatedMigration;
                                        console.warn(`MongooseMigration: Unable to migrate. Migrations are locked at version: ${mgr.version}. Error: ${error}`);
                                        seq.reject(err);
                                    });
                                })
                            }else{
                                this.migrationModel.findOne({ _id: mgr._id }, (err, migration) => {
                                    migration.version = pendMig.version;

                                    migration.save((err, updatedMigration) => {
                                        mgr = updatedMigration;
                                        console.warn(`MongooseMigration: Migrating compleated to version: ${mgr.version}`);
                                        seq.resolve();
                                    });
                                })
                            }
                        } 
                    });
                });

                innerSequencer.execute();
            });

        sequencer.execute();
    }

    /**
     * Migrate db to target migration
     * @param {object} version 
     */
    migrateTo(version){
        if(!version || !Number.isInteger(version))
            throw new Error(`MongooseMigration: ${errorMessages.versionRequired}`);
        
        const sequencer = Sequence();
        let mgr;
        let error = null;
        
        sequencer
            .chain(seq => {
                this.migrationModel.findOne({ }, (err, migration) => {
                    if(!migration){
                        let newMigration = new this.migrationModel;
                        newMigration.version = 0;
                        newMigration.save((err, migration) => {
                            if(err)
                                return seq.reject();
                            
                            mgr = migration;
                            return seq.resolve();
                        })
                    }else{
                        mgr = migration;
                        return seq.resolve();
                    }  
                })
            });
        
        sequencer
            .chain(seq => {
                if(mgr.locked){
                    console.warn(`MongooseMigration: Migrations are locked at version: ${mgr.version}`);
                    return seq.reject();
                }

                return seq.resolve();
            });

        sequencer
            .chain(seq => {
                let targetMigration = this.migrations.filter(mig => {
                    return mig.version === version;
                })[0];

                if(!targetMigration){
                    console.warn(`MongooseMigration: Migration with target version: ${version} does not exist`);
                    return seq.reject();
                }
                    
                try {  
                    targetMigration.up();
                }  
                catch(exception){  
                    error =  exception;
                }  
                finally {
                    if(error){
                        this.migrationModel.findOne({ _id:mgr._id }, (err, migration) => {
                            migration.locked = true;

                            migration.save((err, updatedMigration) => {
                                mgr = updatedMigration;
                                console.warn(`MongooseMigration: Unable to migrate. Migrations are locked at version: ${mgr.version}. Error: ${error}`);
                                seq.reject(err);
                            });
                        })
                    }else{
                        this.migrationModel.findOne({ _id: mgr._id }, (err, migration) => {
                            migration.version = targetMigration.version;

                            migration.save((err, updatedMigration) => {
                                mgr = updatedMigration;
                                console.warn(`MongooseMigration: Migrating compleated to version: ${mgr.version}`);
                                seq.resolve();
                            });
                        })
                    }
                } 
            });

        sequencer.execute();
    }
}

module.exports = Migrations;