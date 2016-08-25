/**
 * Created by Lam on 2016/7/31.
 */
var formidable = require("formidable");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
//首页
//cookie是在res中设置 , req中读取的. 第一次的访问没有cookie.
exports.showIndex = function (req, res, next) {
    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("user", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "moren.jpg";
        } else {
            var avatar = result[0].avatar;
        }
          //检索数据库查出留言;
          res.render("index", {
            "login": login,
            "username": username,
            "active": "首页",
            "avatar": avatar    //登录人的头像
           });
    });
}
//注册页面
exports.showRegist = function (req, res, next) {
    res.render('regist', {
        'login': req.session.login == '1' ? true : false,
        'username': req.session.login == '1' ? req.session.username : "",
        'active': '注册'
    })
}
//注册业务
exports.doRegist = function (req, res, next) {
    //得到用户填写的东西
    var form = new formidable.IncomingForm();
    //得到表单之后做的事情
    form.parse(req, function (err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        //查询数据库中是不是有这个人
        db.find('user', {'username': username}, function (err, result) {
            if (err) {
                res.send("-3") //服务器错误
            }
            if (result.length != 0) {
                res.end('-1');  //被占用;
                return;
            }
            //设置MD5加密
            password = md5(password) + "2";
            //现在可以证明,用户名没有被占用
            db.insertOne('user', {
                'username': username,
                'password': password,
                'avatar': 'moren.jpg'
            }, function (err, result) {
                if (err) {
                    res.send('-3'); //服务器错误
                    return;
                }
                //session
                req.session.login = '1';
                req.session.username = username;
                res.send('1');  //注册成功,写入session;
                //主要send要写在最后;
            })
        })
    })
    //查询数据库中的东西
}
//登录页面
exports.showLogin = function (req, res, next) {
    res.render('login', {
        'login': req.session.login == '1' ? true : false,
        'username': req.session.login == '1' ? req.session.username : "",
        'active': '登录'
    })
}
//登录页面的执行页面
exports.doLogin = function (req, res, next) {
    //得到用户表单;
    //查询数据库,看看有没这个人;
    //有的话,进一步看看这个人的密码是否匹配;
    var form = new formidable.IncomingForm();
    //得到表单之后做的事情
    form.parse(req, function (err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        var jiamihou = md5(password) + "2";
        db.find('user', {"username": username}, function (err, result) {
            //有的话,进一步看看这个人的密码是否匹配
            if (err) {
                res.end('-5');
                return;
            }
            //没有这个人
            if (result.length == 0) {
                res.end('-1');
                //res.send('-1');
                return;
            }
            if (jiamihou == result[0].password) {
                req.session.login = '1';
                req.session.username = username;
                //有的话,进一步看看这个人的密码是否匹配
                res.end('1')  //登录成功
                return;
            } else {
                res.end('-2'); //密码错误
                return;
            }
        })
    });
}
//设置头像页面,必须保证此时是登录状态
//渲染上传头像的页面;
exports.showSetavatar = function (req, res, next) {
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render('setavatar', {
        'login': true,
        'username': req.session.username || 'weibiao',
        'active': '修改头像'
    })
}
//点击上传按钮后请求dosetavatar做的事情,执行dosetavatar;
//设置头像
exports.dosetavatar = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }

    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar");
    form.parse(req, function (err, fields, files) {
        var oldpath = files.touxiang.path;
        var newpath = path.normalize(__dirname + "/../avatar") + "/" + req.session.username + ".jpg";
        //把图片的名字改为名字+.jgp
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.send("失败");
                return;
            }
            //然后存在session中;
            req.session.avatar = req.session.username + ".jpg";
            //跳转到切的业务
            res.redirect("/cut");
        });
    });
}
//显示切图页面
exports.showcut = function (req, res) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.send("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("cut", {
        avatar: req.session.avatar
    })
};
//执行切图
exports.docut = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.send("非法闯入，这个页面要求登陆！");
        return;
    }
    db.updateMany("user", {"username": req.session.username}, {
        $set: {"avatar": req.session.avatar}
    }, function (err, results) {
        res.end("1");
    });
}
//发表说说
exports.doPost = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.send("非法闯入，这个页面要求登陆！");
        return;
    }
    //用户名
    var username = req.session.username;

    //得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var content = fields.content;

        //现在可以证明，用户名没有被占用
        db.insertOne("posts", {
            "username": username,
            "datetime": new Date(),
            "content": content
        }, function (err, result) {
            if (err) {
                res.send("-3"); //服务器错误
                return;
            }
            res.end("1"); //注册成功
        });
    });
};
//列出所有说说，有分页功能
exports.getAllShuoshuo = function(req,res,next){
    //这个页面接收一个参数，页面
    var page = req.query.page;
    db.find("posts",{},{"pageamount":20,"page":page,"sort":{"datetime":-1}},function(err,result){
        res.json(result);
    });
};
//查找某个人的全部信息 ;
exports.getuserinfo = function(req,res,next){
    var username = req.query.username;
    db.find("user",{'username':username},function(err,result){
       var obj = {
           'username':result[0].username,
           'avatar':result[0].avatar,
           '_id':result[0]._id
       }
        res.json(obj)
    });
}



