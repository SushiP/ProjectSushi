function Room(){
    if(arguments.length > 0){ //If there is at least one user.
        this.name = "room" + Room.counter;
        this.users = [];
        
        for(var i in arguments)
            this.users.push(arguments[i]);
        
        Room.counter++;
        
        this.user_list = function(){
            var list = "var list=[";
            
            for(var i = 0; i < this.users.length; i++){
                list += "{'nick':'" + this.users[i] + "'}";
                if(i != this.users.length)
                    list += ",";
            }

            list += "];";
            return list;
        }
        
        this.delete_member = function(member){
            for(var i = 0; i < this.users.length; i++){
                if(this.users[i] == member){
                    this.users.splice(i, 1);
                    return true;
                }
            }
        }
    }
}

Room.counter = 1;

module.exports = {
    /*User class.*/
    chatUser: function(nick, socket){
        this.nick = nick;
        this.socket = socket;
        this.print = function(){
            console.log("I'm " + this.nick);
        }
    },
    
    /*Print all the users*/
    print_users: function(arrayUser){
        for(var user in arrayUser)
            arrayUser[user].print();
    },
    
    prova:function(){
        console.log("OK");
    },
    
    control_user: function(newUser, arrayUser){
        for(var user in arrayUser)
            if(arrayUser[user].nick == newUser)
                return false;
        return true;
    },
    
    create_list_user: function(arrayUser){
        var list = "var list=[";
        var i = 0;
        
        for(var user in arrayUser){
            i++;
            list += "{'nick':'" + user + "'}";
            if(i != arrayUser.length)
                list += ",";
        }
        
        list += "];";
        return list;
    },
    
    Room: Room
}