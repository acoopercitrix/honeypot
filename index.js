// index.js
const path = require('path')  
const express = require('express')  
const exphbs = require('express-handlebars')
const port = 3001
const app = express()

const AttackEvent = require("./attackevent");
var attackEvent = new AttackEvent();
app.engine('.hbs', exphbs({  
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')  
app.set('views', path.join(__dirname, 'views'))  
app.use('/', express.static(path.join(__dirname, 'webapp')));
app.get("/attacks", function(req, res) {
  var sendEvent = startEventSource(res);
  attackEvent.on("add", sendAttack);
  attackEvent.on("ping", sendPing);
  console.log("Listener added");
  attackEvent.start();
  // Important to remove listener after closing connection
  // to avoid memory leak
  req.on("close", function() {
  	console.log("Listener removed");
    attackEvent.removeListener("add", sendAttack);
    attackEvent.removeListener("ping", sendPing);
  });
       
  function sendAttack(attack) {
  	sendEvent("attack", attack);
  }
  function sendPing(timestamp) {
  	sendEvent("ping", timestamp);
  }
});
app.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

function startEventSource(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.write("\n");

  return function sendEvent(name,data,id) {
  	//console.log(data);
    res.write("event: " + name + "\n");
    if(id) res.write("id: " + id + "\n");
    res.write("data: " + JSON.stringify(data) + "\n\n");
  }
}
