var router = require("express").Router();

function 로그인했니(request,response,next){
    if(request.user){
        next()
    }else{
        response.send("로그인안하셨는데요?");
    }
}

router.use(로그인했니);

router.get('/shirts', (request,response)=>{
    response.send("셔츠 파는 페이지 입니다");
})
router.get("/pants", (request,response)=>{
    response.send("바지 파는 페이지 입니다");
})

module.exports = router;