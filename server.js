const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
let db;
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

MongoClient.connect('mongodb+srv://lomadia:gksmslaqt12@cluster0.qtcu0c4.mongodb.net/?retryWrites=true&w=majority', (error, client) => {
    
    if(error) return console.log("DB 연결되지 않음" + error);

    db = client.db('nodepractice');

    app.listen(8081, () => {
        console.log('listening on 8081');
    });



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

app.post('/add',(request,response) => {
    response.send("전송 완료");
    db.collection('counter').findOne({name : '게시물갯수'}, (error, result) => {   
        var postCount = result.totalPost;
        db.collection('post').insertOne({ _id : postCount + 1, Title : request.body.title, Date : request.body.date },(error,result)=>{
            console.log("작성 성공");

            db.collection('counter').updateOne({name : '게시물갯수'},{ $inc : {totalPost : 1}},(error, result) => {
                if(error){return console.log(error)}

            });
        });


    })
})

app.get('/list',(request,response) => {
    
    db.collection('post').find().toArray((error, result) => {
        console.log(result);
        response.render('list.ejs', {posts : result});
    });
    
})

app.delete('/list',(request,response) => {
    request.body._id = parseInt(request.body._id);
    db.collection('post').deleteOne(request.body, (error, result) => {
        console.log('삭제 완료');
        response.status(200).send({ message : '삭제 완료' });
    });

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








