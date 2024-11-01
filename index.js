const db = require('./db')

const TelegramBot = require('node-telegram-bot-api');
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});


const intervals = [20*60*1000, 1*60*60*1000, 7*60*60*1000] // 20m, 1h, 7h
//const intervals = [20*60*1000, 20*60*1000, 20*60*1000]
//const intervals = [5*1000, 5*1000, 5*1000]
let timer
start_timer_from_saved_step () // resume timer if container down


function start_timer_from_saved_step () {
  let user = get_user(114668119) // my id
  let step = user.get('current_step').value()
  let interval_started = user.get('interval_started').value()
  let chat_id = user.get('chat_id').value()
  
  if ( step === null || !interval_started || !chat_id ) return
  if ( Date.now() < interval_started + intervals[step] ) {
    let timeout = interval_started + intervals[step] - Date.now()
    init_timer( chat_id, user, step, timeout )
  }
  if ( Date.now() >= interval_started + intervals[step] ) {
    bot.sendMessage(chat_id, `Time to open Anki! (missed reminder, missed step ${step})`)
    step++
    init_timer( chat_id, user, step, intervals[step] )
  }
}
                

function start_timer_from_scratch ( chat_id, user, step, timeout ) {
  user.set('chat_id', chat_id).write()
  user.set('current_step', step).write()
  user.set('interval_started', Date.now()).write()
  init_timer( chat_id, user, step, timeout )
}


function init_timer ( chat_id, user, step, timeout ) {
  
  timer = setTimeout( function tick () {
    step++
    
    if ( step >= intervals.length ) bot.sendMessage(chat_id, `Time to open Anki!`)
    else bot.sendMessage(chat_id, `Time to open Anki! Next step is /step${step + 1}`) // step + 1 to bring steps to 1,2,3
    
    return stop_timer( user )
    
//     step++
    
//     if ( step >= intervals.length ) bot.sendMessage(chat_id, `Time to open Anki! Congratulations the last reminder for today!`)
//     else bot.sendMessage(chat_id, `Time to open Anki! Next reminder in ${convert_time(intervals[step])}`)
      
//     if ( step >= intervals.length ) {
//       user.set('step', null).write()
//       user.set('interval_started', null).write() 
//       return stop_timer()
//     }

//     user.set('step', step).write()
//     user.set('interval_started', Date.now()).write()
        
//     timer = setTimeout( tick, intervals[step] )    
  }, timeout )
  
  return timer
}

function stop_timer ( user ) {
  clearTimeout( timer )
  timer = null
  user.set('current_step', null).write()
  user.set('interval_started', null).write()
}

function time_to_remind ( user_id ) {
  let user = get_user( user_id )
  let step = user.get('current_step').value()
  let interval_started = user.get('interval_started').value()
  if ( step === null || !interval_started ) return 'Missed data. "step" or "interval_started" is not defined.'
  let ttr = interval_started + intervals[step] - Date.now()
  return `Next reminder in ${convert_time(ttr)}`
}


function is_owner ( msg_id ) {
  if ( msg_id === 114668119 ) return 1 // my id
  return 0
}
function is_not_owner ( bot, msg ) {
  if ( is_owner( msg.from.id ) ) return 0
  bot.sendMessage( msg.chat.id, 'Sorry but this bot is accessible for owner only. If you really need it please contact @rosivv')
  return 1
}


function get_user ( user_id ) {
  return db.get('users').find(['user_id', user_id])
}
function add_user ( user_id, chat_id ) {
  return db.get('users').push({user_id: user_id, chat_id: chat_id, step: null, interval_started: null}).write()
}


function convert_time ( time ) {
  let minutes = (time /1000/60).toFixed()
  if ( minutes < 60 ) return `${minutes} min`
  else if ( minutes === 60 ) return `${minutes/60} hour`
  else return `${(minutes/60).toFixed(1)} hours`
}


// Commands

/*
/step1 - 20m Timer
/step2 - 1h Timer
/step3 - 7h Timer
/end - Stop Timer
/ttr - Get time to reminder
*/

bot.onText(/\/step(\d)/i, (msg, match) => {
  if ( is_not_owner( bot, msg ) ) return
  if ( timer ) return bot.sendMessage( msg.chat.id, 'Timer is running')
  let user = get_user( msg.from.id )
  if ( !user.value() ) add_user( msg.from.id, msg.chat.id )
  let step = match[1] - 1 // get step index
  if ( step >= intervals.length ) return
  start_timer_from_scratch( msg.chat.id, user, step, intervals[step] )
  bot.sendMessage( msg.chat.id, `Countdown has started. Next reminder in ${convert_time(intervals[step])}`)
})

bot.onText(/\/end/i, (msg, match) => {
  if ( is_not_owner( bot, msg ) ) return
  if ( !timer ) return bot.sendMessage( msg.chat.id, 'No timer exists')
  let user = get_user( msg.from.id )
  if ( !user.value() ) add_user( msg.from.id, msg.chat.id )
  stop_timer( user )
  bot.sendMessage( msg.chat.id, 'Countdown has stopped')
})

bot.onText(/\/ttr/i, (msg, match) => {
  if ( is_not_owner( bot, msg ) ) return
  if ( !timer ) return bot.sendMessage( msg.chat.id, 'No timer exists')
  bot.sendMessage( msg.chat.id, time_to_remind( msg.from.id ) )
})

bot.onText(/\/start/i, (msg, match) => {
  bot.sendMessage( msg.chat.id, `Get notifications about "Learning Cards" during the day. 
Timer intervals: 20m, 1h, 7h. 
Press '/' button to see the Commands.`)
})