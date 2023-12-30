import express from "express";
import bodyParser from "body-parser";
import { Server } from 'socket.io'
import cors from 'cors'
import http from 'http'

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

const server = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin : '*'
    }
})

//key socketid and value is an object having name and email
const socketToUserMapping = new Map();

io.on('connection', (socket) => {
    console.log("User Connected:" , socket.id)
    
    socket.on("login" , (data) => {
        const { name, email } = data;
        console.log('user joined:' , data )
        socketToUserMapping.set(socket.id, data);
        socket.emit("login_successful", { ...data, id: socket.id })
    })

    socket.on("new-user-online" , () => {
        const onlineUsers = Array.from(socketToUserMapping.entries());
        io.emit('online-users', { onlineUsers});
    })

    socket.on('call_user', ({to, offer}) => {
        console.log('user called', to);
        const name = socketToUserMapping.get(socket.id).name;
        socket.to(to).emit('incomming_call', { from: socket.id, offer, name})
    })
    
    socket.on('call_accepted', ({ to, ans }) => {
        console.log('call accepted', to );
        socket.to(to).emit('call_accepted', { from: socket.id, ans })
    })

    socket.on('ice-candidate', (data) => {
        console.log('ice candidate')
        console.log(data.candidate)
        io.to(data.to).emit('ice-candidate', data.candidate);
    });

    socket.on('end-call', ({to}) => {
        console.log('call ended');
        console.log(to);
        socket.to(to).emit('call-ended', {from: socket.id})
    })
    socket.on('disconnect', ({to}) => {
        socketToUserMapping.delete(socket.id);
        const onlineUsers = Array.from(socketToUserMapping.entries());
        io.emit('online-users', { onlineUsers});
        console.log('user disconnected');
    })

});

const port = process.env.PORT || 8001;
server.listen(port, ()=> {
    console.log('socket is up and running on port: ', port);
})



/*
Use socket.to(data.room).emit("joined_room", data) if you want all clients in the specified room, including the sender, to receive the event.
Use socket.broadcast.to(data.room).emit("joined_room", data) if you want all clients in the specified room, except the sender, to receive the event.
*/

/*

  socket.on('offer', (data) => {
     io.to(data.target).emit('offer', data.offer);
  });

  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', data.answer);
  });



  */