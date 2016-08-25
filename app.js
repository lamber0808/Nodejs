var express = require("express");
var app = express();
//引入路由模块
var router = require('./router/router.js')
//引入db文件;

var session = require('express-session');

//使用session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));


//模版引起
app.set('view engine','ejs');
//静态页面
app.use(express.static('./public'));
app.use('/avatar',express.static('./avatar'));

//路由表
app.get('/',router.showIndex);
app.get('/regist',router.showRegist);
app.post("/doregist",router.doRegist);      //执行注册，Ajax服务
app.get('/login',router.showLogin);
app.post('/dologin',router.doLogin);
app.get('/setavatar',router.showSetavatar);
app.post('/dosetavatar',router.dosetavatar);
app.get('/cut',router.showcut)
app.get("/docut",router.docut);             //执行剪裁
app.post('/post',router.doPost);            //发表说说,没有界面用do;
app.get('/getAllShuoshuo',router.getAllShuoshuo)  //列出全部说说Ajax服务
app.get('/getuserinfo',router.getuserinfo)
app.listen(3000);