var router = require("express").Router();

router.get("/sports", (request, response) => {
    response.send("스포츠 게시판");
})

router.get("/game", (request, response) => {
    response.send("보드게임 게시판");
})

module.exports = router;