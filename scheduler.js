
const schedule = require('node-schedule');

const job = schedule.scheduleJob('*/15 * * * * *', function(){
  console.log('bru');
});