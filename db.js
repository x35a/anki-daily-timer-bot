const low = require('lowdb')

const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json', { serialize: (obj) => JSON.stringify(obj) })
const db = low(adapter)

// DB schema
// Tables

/*
{
users: [ {
  user_id: integer,
  chat_id: integer,
  step: null | integer, // what interval is current
  interval_started: null | integer, // unixtime, the time when interval started
}, ]
}
*/

// Init DB Tables
db.defaults({
    users: []
}).write()


// Add prop in objects array
// db.get('guilds').each(guild => guild.status = 'joined').write()

// Update prop in single object
// db.get('guilds').find(['guild_id', '357538487098015744']).set('settings.audio_file_name', 'guitar.mp3').write()

// Update prop in objects array
// db.get('guilds').forEach( guild => guild.lastmodified = null ).write()

// Remove single object or prop
// db.unset('deleted_guilds').write()

// Remove objects in objects array
// db.get('logs').remove( user => user.user_id == '281934003295223808' ).write()

// Remove prop in objects array
// db.get('guilds').each(guild => delete guild.lastmodified).write()

// Clear whole array
// db.get('logs').remove().write()


// Count guilds
// console.log('Guilds total', db.get('guilds').value().length)
// let guilds_joined = 0
// let guilds_deleted = 0
// db.get('guilds').each(guild => {if (guild.status === 'joined') guilds_joined++}).value()
// db.get('guilds').each(guild => {if (guild.status === 'deleted') guilds_deleted++}).value()


// Migration



module.exports = db