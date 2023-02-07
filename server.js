const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);

let db;
MongoClient.connect(process.env.DB_URL, (error, client) => {
    
    if(error) return console.log("DB 연결되지 않음" + error);

    db = client.db('nodepractice');

    http.listen(process.env.PORT, () => {
        console.log('listening on 8081');
        //express 쓸때 웹소켓 오픈 가능
    });

    // app.listen(process.env.PORT, () => {
    //     console.log('listening on 8081');
    // }); 서버 띄우는 코드 쌩 node.js를 쓸때

});

app.get('/pet', (request, response) => {
    response.send('펫용품 쇼핑할 수 있는 페이지 입니다.');
});

app.get('/beauty',(request,response) => {
    response.send('뷰티 페이지 응답');
});

//==============================================================================================================

app.get('/',(request,response) => {
    response.render('index.ejs',{});
});

app.get('/write',(request,response) => {
    response.render('write.ejs',{});
})

app.get('/list',(request,response) => {
    
    db.collection('post').find().toArray((error, result) => {
        console.log(result);
        response.render('list.ejs', {posts : result, value:null});
    });
    
})
app.get('/search',(request,response)=>{
    let searchTerm = [
        {
          $search: {
            index: 'searchTitle',
            text: {
              query: request.query.value,
              path: 'Title'
            }
          }
        },
       { $sort : { _id : 1 } },
       { $limit : 10 },
       { $project : { Title : 1, _id : 1 , Date:1} }
    ]
    db.collection('post').aggregate(searchTerm).toArray((error,result) => {
        console.log(result)
        response.render('list.ejs', {posts : result, value:request.query.value});
    })
})




app.get('/detail/:id', (request, response) => {
    db.collection('post').findOne({_id : parseInt(request.params.id)},(error, result) => {
        console.log(result);
        if(result == null) {
            response.status(400).send({message : '해당 게시물은 삭제됬거나 존재하지 않습니다.'})
        }
        response.render('detail.ejs',{data : result});
    })
    
})

app.get('/edit/:id',(request,response) => {
    db.collection('post').findOne({'_id' : parseInt(request.params.id)}, (error, result) => {
        console.log(result);
        if(!result) {
            response.status(400).send({message : '해당 게시물은 삭제됬거나 존재하지 않습니다.'})
        }
            response.render('edit.ejs',{data : result});

    })    
})

app.put('/edit',(request,response) => {
    db.collection('post').updateOne({_id: parseInt(request.body._id)}, {$set : {Title : request.body.title, Date : request.body.date}}, (error, result) => {
        console.log("수정 완료");
        response.redirect("/list");
    })

})

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : 'lomasecret', resave : true, saveUninitialized: false}))
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',(request, response) => {
    response.render("login.ejs");
})
app.post('/login', passport.authenticate('local', {
    failureRedirect : "/fail"
}),(request, response) => {
    response.redirect("/");
})
app.get('/fail',(request, response) => {
    response.send("로그인 실패");
})

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    db.collection('login').findOne({id: id},(error, result)=>{
        done(null,result);
    })
})


function 로그인했니(request,response,next){
    if(request.user){
        next()
    }else{
        response.send("로그인안하셨는데요?");
    }

}


app.post("/register",(request,response)=> {
    db.collection("login").insertOne({id:request.body.id, pw: request.body.pw},(error,result)=>{
        response.redirect("/");
    })

})

app.post('/add',(request,response) => {
    console.log(request.user._id);
    response.send("전송 완료");
    db.collection('counter').findOne({name : '게시물갯수'}, (error, result) => {   
        var postCount = result.totalPost;
        db.collection('post').insertOne({ _id : postCount + 1, Title : request.body.title, Date : request.body.date,writer : request.user._id },(error,result)=>{
            console.log("작성 성공");
            db.collection('counter').updateOne({name : '게시물갯수'},{ $inc : {totalPost : 1}},(error, result) => {
                if(error){return console.log(error)}
            });
        });
    })
})

app.delete('/list',(request,response) => {
    request.body._id = parseInt(request.body._id);
    let 삭제할데이터 = {_id : request.body._id, writer : request.user._id}

    db.collection('post').deleteOne(삭제할데이터, (error, result) => {
        console.log('삭제 완료');
        if(result){console.log("======================="+result)}
        response.status(200).send({ message : '삭제 완료' });
    });

})
app.use("/shop", require("./routes/shop"))

app.use("/board/sub", require("./routes/board"))

// 이미지 업로드 로직
// multer 라이브러리

let multer = require("multer");
var storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, "./public/image")
    },
    filename : function(req, file, cb){
        cb(null, file.originalname)        
    }
    // ,filefilter: function(req, file, cb){

    // },
    // $limit : function(req, file, cb){

    // }
});


var upload = multer({storage : storage});

app.get("/upload",(request, response) => {
    response.render("upload.ejs");
});

app.post("/upload", upload.single("filename"),(request, response) => {
    response.send("업로드 완료");
});

app.get("/image/:imageName",function(request, response){
    response.sendFile(__dirname + "/public/image/" + request.params.imageName)
})


app.post("/chatroom", 로그인했니, (request, response) => {
    var package = {
        title : "채팅방이름" ,
        member : [request.body.writer, request.user._id],
        date : new Date()
    }
    db.collection("chatroom").insertOne(package,(error,result) => {
        response.send("채팅방 개설 완료")
    })
})

app.get("/mypage", 로그인했니, (request, response) => {
    response.render("mypage.ejs");
})

app.get("/chat", 로그인했니,(request, response)=> {
    db.collection("chatroom").find({member : request.user._id}).toArray((error,result) => {
        response.render("chat.ejs", {data : result});
    })
});



app.get('/message/:parentid', 로그인했니, function(request, response){

    response.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
  
    db.collection('message').find({ parent: request.params.parentid }).toArray()
    .then((result)=>{
      console.log(result);
      response.write('event: test\n');
      response.write(`data: ${JSON.stringify(result)}\n\n`);
    });
  
  
    const findDocu = [
      { $match: { 'fullDocument.parent': request.params.parentid } }
    ];
  
    const changeStream = db.collection('message').watch(findDocu);
    changeStream.on('change', result => {
    console.log("체인지 스트림 변경확인")
      var addDocu = [result.fullDocument];
      response.write('event: test\n');
      response.write(`data: ${JSON.stringify(addDocu)}\n\n`);
    });
  
  });

  app.post("/message", (request, response) => {

    let chatData = {
        parent : request.body.parent,
        content : request.body.content,
        uderid : request.user._id,
        date : new Date()
    }
        db.collection('message').insertOne(chatData ,(error, result) => {
        console.log("DB 저장 성공");
        response.send("send까지");
    })

})
app.get("/socket", (request, response) => {
    response.render("socket.ejs");    
});

io.on('connection',(socket)=>{

    socket.on("joinroom1", function(data){
        socket.join('room1');
    })

    socket.on("room1-send",function(data){
        io.to("room1").emit('broadcast',data);
    })

    socket.on("user-send", function(data) {
        // io.to(socket.id).emit("broadcast", data);
        io.emit('broadcast', data);
    })
});


