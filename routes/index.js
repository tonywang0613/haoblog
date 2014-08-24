//var express = require('express');
//var router = express.Router();

/* GET home page. */
//router.get('/', function(req, res) {
  //res.render('index', { title: 'Express' });
//});

//exports.index=function(req,res){
		//console.log(app.get('port'));
		//res.render('index',{title:'Express'});
	//};
var crypto=require('crypto'),
	User=require('../models/user.js'),
	Post=require('../models/post.js'),
	Comment=require('../models/comment.js'),
	formidable=require('formidable'),
	fs=require('fs');

module.exports = function(app){
	app.get('/',function(req,res){

		var page=req.query.p?parseInt(req.query.p):1;

		Post.getTen(null,page,function(err,posts,total){
			if(err){
				posts=[];
			}
			res.render('index',{
				title:'Home Page',
				posts:posts,
				page:page,
				isFirstPage:(page-1)==0,
				isLastPage:((page-1)*10+posts.length)==total,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()

			});
		});
			
	});

	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'Registration',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){

		var name=req.body.name,
			password=req.body.password,
			password_re=req.body['password_repeat'];

		if(password!=password_re){
			req.flash('error','The password is not the same!');
			return res.redirect('/reg');
		}

		var md5=crypto.createHash('md5'),
			password=md5.update(req.body.password).digest('hex');
		var newUser=new User({
			name:name,
			password:password,
			email:req.body.email
		});

		User.get(newUser.name,function(err,user){
			if(user){
				req.flash('error','the user already exits!')
				return res.redirect('/reg');
			}

			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/reg');
				}

				req.session.user=user;
				req.flash('success','Registration success');
				return res.redirect('/');
			});
		})
	});
	
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'Login',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	 app.post('/login', checkNotLogin);
	app.post('/login',function(req,res){

		var md5=crypto.createHash('md5'),
			password=md5.update(req.body.password).digest('hex');

		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','Wrong password');
				return res.redirect('/login');
			}

			req.session.user=user;
			req.flash('success','Login success');
			res.redirect('/');
		});

	});

	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title:'Post',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUser=req.session.user,
			tags=[req.body.tag1,req.body.tag2,req.body.tag3],
			post=new Post(currentUser.name,currentUser.head,req.body.title,tags,req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success',"Publish success");
			res.redirect('/');
		});
	});

	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){

		req.session.user=null;
		req.flash('success','logout success');
		res.redirect('/');

	});

	app.get('/upload',checkLogin);
	app.get('/upload',function(req,res){
		res.render('upload',{
			title:'Upload File',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	app.post('/upload',checkLogin);
	app.post('/upload',function(req,res){
		var form=new formidable.IncomingForm();
		form.uploadDir='./public/images';
		form.keepExtension=true;
		form.parse(req,function(err,fields,files){
			if(err){
				req.flash('error',err);
				return res.redirect('/upload');
			}
			for (var i in files){
				if(files[i].size==0){
					fs.unlinkSync(files[i].path);
					console.log('Successfully removed an empty file!');
				}else{
					var target_path='./public/images/'+files[i].name;
					fs.renameSync(files[i].path,target_path);
					console.log('Successfully renamed a file!');

				}
			}
			req.flash('success','Successfully uploaded files');
			res.redirect('/upload');
		});
	});

	app.get('/archive',function(req,res){
		Post.getArchive(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('archive',{
				title:'archive',
				posts:posts,
				user:req.session.user,
				success: req.flash('success').toString(),
        		error: req.flash('error').toString()
			});
		});
	});

	app.get('/tags',function(req,res){
		Post.getTags(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tagsPage',{
				title:'tags',
				posts:posts,
				user:req.session.user,
				success: req.flash('success').toString(),
        		error: req.flash('error').toString()
			});
		});
	});

	app.get('/tags/:tag',function(req,res){
		Post.getTag(req.params.tag,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tagPost',{
				title:'TAG: '+req.params.tag,
				posts:posts,
				user:req.session.user,
				success: req.flash('success').toString(),
        		error: req.flash('error').toString()
			});
		});
	});

	app.get('/search',function(req,res){
		Post.search(req.query.keyword,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('search',{
				title:"SEARCH"+req.query.keyword,
				posts:posts,
				user: req.session.user,
      			success: req.flash('success').toString(),
      			error: req.flash('error').toString()
			});
		});
	});

	app.get('/u/:name',function(req,res){
		var page=req.query.p?parseInt(req.query.p):1;

		User.get(req.params.name,function(err,user){
			if(!user){
				req.flash('error','User not exited');
				return res.redirect('/');
			}

			Post.getTen(user.name, page, function (err, posts, total) {
      			if (err) {
        			req.flash('error', err); 
        			return res.redirect('/');
     			} 
      			res.render('user', {
        			title: user.name,
        			posts: posts,
        			page: page,
        			isFirstPage: (page - 1) == 0,
        			isLastPage: ((page - 1) * 10 + posts.length) == total,
        			user: req.session.user,
        			success: req.flash('success').toString(),
        			error: req.flash('error').toString()
      		});		

			});
		});
	});

	app.get('/u/:name/:day/:title',function(req,res){
		Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article',{
				title:req.params.title,
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});

	app.post('/u/:name/:day/:title', function(req,res){
		var date=new Date(),
			time=date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var md5=crypto.createHash('md5'),
        	email_MD5=md5.update(req.body.email.toLowerCase()).digest('hex'),
        	head="http://www.gravatar.com/avatar/"+email_MD5+"?s=48";
        var comment={
        	name:req.body.name,
        	head:head,
        	email:req.body.email,
        	website:req.body.website,
        	time:time,
        	content:req.body.content
        };
        var newCommnet=new Comment(req.params.name,req.params.day,req.params.title,comment);
        newCommnet.save(function(err){
        	if(err){
        		req.flash('error',err);
        		return res.redirect('back');
        	}
        	req.flash('success','Comment success');
        	res.redirect('back');
        });

	});

	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req,res){
		var currentUser=req.session.user;
		Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title:'Edit',
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});

	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title', function(req,res){
		var currentUser=req.session.user;
		Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
			var url='/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title;
			if(err){
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','Change success');
			res.redirect(url);
		});
	});

	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req,res){
		var currentUser=req.session.user;
		Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','Delete success');
			res.redirect('/');
		});
	});


	app.get('/links',function(req,res){
		res.render('links',{
			title:'Links',
			user:req.session.user,
			success: req.flash('success').toString(),
    		error: req.flash('error').toString()
		});
	});

	app.use(function(req,res){
		res.render("404");
	})

	function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','Not login!');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','already registered!');
			res.redirect('back');
		}
		next();
	}
//
//	app.get('nsw',function(req,res){
//		res.send('hello world!');
//	});

};



