var fs = require("fs"), url = require("url"), sock = require('socket.io')(require("http")); //Node Js and Socket.io require.
var userLib = require("./manage_user.js"); //manage user library.
var port = 9350;
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};
var staticFolder = "public";
var server = require("http").createServer(router).listen(port,'23.97.225.177'); //server
var connectedUser = [];
var rooms = [];

sock.listen(server);
sock.on('connection', manage_socket);

setInterval(function(){
    eval(userLib.create_list_user(connectedUser));
    
    console.log("print function: ");
    
    for(var i = 0; i < list.length; i++)
        console.log(list[i].nick); 
}, 60000);


function router(req, res){
    var path = url.parse(req.url).pathname;
    
    function print404(){
        res.writeHead(404);
        res.end("page not found");
    }
    
    /*Static files.*/
    if(path.indexOf(staticFolder) >= 0){
        fs.readFile(__dirname + path, function(error, data){
            var exts = path.substring(path.indexOf(".") + 1);
            
            if(!error){
                res.writeHead(200, {'Content-Type': mimeTypes[exts]});
                res.write(data,'binary');
                res.end();
            }
        });
    }
    /*Dynamic files.*/
    else{
        switch(path){
            case "/newchat":
                fs.readFile(__dirname + path + ".html", "utf8", function(error, data){
                    try{
                        if(error)
                            throw(error);
                        else{
                            res.writeHead(200, {'Content-Type' : 'text/html',
                                                'Content-Length' : data.length});
                            res.end(data);
                        } 
                    }catch(err){
                        print404();
                    }    
                });
                break;
            default:
                print404();
                break;
        }
    }
}

function invite_to_room(){
    for(var i = 2; i < arguments.length - 1; i++)
        connectedUser[arguments[i]].emit("newPrivateRoom", arguments[arguments.length - 1]);
}

function broadcast_list(){
    for(var user in connectedUser)
        connectedUser[user].emit('list', userLib.create_list_user(connectedUser));
}

function broadcast_message(nick, mess, color, room){ 
    if(room){
        connectedUser[nick].broadcast.to(room.substring(1)).emit('newMessage', {'nick': nick, 'mess' : mess, 'color': color, 'room': room});
        connectedUser[nick].emit('newMessage', {'nick': nick, 'mess' : mess, 'color': color, 'room': room});
    }
    else
        for(var user in connectedUser){
            if(nick)
                connectedUser[user].emit('newMessage', {'nick': nick, 'mess' : mess, 'color': color, 'room': room});
            else
                connectedUser[user].emit('newMessage', {'mess' : mess, 'room': room});
        }
}

function manage_socket(socket){
    var nick = socket.handshake.query.nick, user = null;
    
    console.log(nick + " connected");
    
    function join_room(roomName){
        socket.join(roomName);

        socket.emit("list", rooms[roomName].user_list(), roomName);
        socket.broadcast.to(roomName).emit("list", rooms[roomName].user_list(), roomName);
    }
    
    function exit_room(roomName){
        console.log("Delete");
        socket.leave(roomName);
        
        rooms[roomName].delete_member(nick);
        socket.broadcast.to(roomName).emit("list", rooms[roomName].user_list(), roomName);
    }
    
    /*Control if nick is ok.*/
    if(userLib.control_user(nick, connectedUser)){
        //socket.emit('isNickOk', {'isOk': 'true'});
        user = new userLib.chatUser(nick, socket);
        
        /*Adverte all the connected user a new user has been connected.*/
        broadcast_message(null,nick + " has been connected...", null, "");
        
        connectedUser[user.nick] = user.socket;
        
        /*Broadcast the new list to all.*/
        broadcast_list();
    }
    else{
        socket.emit('isNickOk', {'isOk': 'false'});
        socket.disconnect();
        return;
    }
    
    /*Broadcast message.*/
    socket.on('message', function(data){
        broadcast_message(data.nick, data.mess, data.color, data.room);
    });

    /*Logout*/
    socket.on('logout', function(data){
        delete connectedUser[nick];
        /*Adverte all the connected user a new user has been disconnected.*/
        broadcast_message(null,nick + " has been disconnected...", null, "");
        broadcast_list();
        socket.disconnect();
    });
    
    socket.on('createPrivateRoom', function(){
        var handlerArg = ['foo'];
        
        /*Create the array of the handler arguments.*/
        for(var i = 0; i < arguments.length; i++)
            handlerArg.push(arguments[i]);
        
        var newRoom = new (Function.prototype.bind.apply(userLib.Room, handlerArg));
        
        if(newRoom instanceof userLib.Room)
            socket.emit("newPrivateRoom", newRoom.name);
        //ADD THROW..CATCH BLOCK.
        
        /*Join to the room and add it to the current joined rooms.*/
        handlerArg.push(newRoom.name);
        invite_to_room.apply(this, handlerArg);
        
        /*Add the rooms to the current rooms.*/
        rooms[newRoom.name] = newRoom;
    });
    
    socket.on("joinPrivateRoom", join_room);
    
    socket.on("exitPrivateRoom", exit_room);
}
