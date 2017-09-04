// BASE SETUP
// =============================================================================
// call the packages we need
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
///////////////////////////////////////////////////////////////
var AuthenticationController = require('./config/authentication');  
  //  TodoController = require('./controllers/todos'),  
var passportService = require('./config/passport');
var passport = require('passport');
 
var requireAuth = passport.authenticate('jwt', {session: false});
var requireLogin = passport.authenticate('local', {session: false});
 

    // Todo Routes
  //  apiRoutes.use('/todos', todoRoutes);
 
  //  todoRoutes.get('/', requireAuth, AuthenticationController.roleAuthorization(['reader','creator','editor']), TodoController.getTodos);
  //  todoRoutes.post('/', requireAuth, AuthenticationController.roleAuthorization(['creator','editor']), TodoController.createTodo);
  //  todoRoutes.delete('/:todo_id', requireAuth, AuthenticationController.roleAuthorization(['editor']), TodoController.deleteTodo);
 
    // Set up routes
  //  app.use('/api', apiRoutes);

/////////////////////////////////////////////////////////////////

//enable logger v2.3
const log4js = require('log4js');
log4js.configure({
	appenders: { logfile: { type: 'file', filename: '/opt/app/log/logfile.log' } },
	categories: { default: { appenders: ['logfile'], level: 'debug' } }
});

const logger = log4js.getLogger('logfile');

console.log = logger.info.bind(logger); // do the same for others - console.debug, etc.

app.use(log4js.connectLogger(logger, { level: 'debug' }));


// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//keep these for testing purpose
app.use('/mathapp', express.static(path.join(__dirname, 'userapps/math-ionic-app')));
app.use('/confapp', express.static(path.join(__dirname, 'userapps/confapp/www')));
app.use('/empapp', express.static(path.join(__dirname, 'userapps/empapp/www')));
app.use('/mathadmin', express.static(path.join(__dirname, 'userapps/qnadmin')));

//ip address and ports
var port = process.env.OPENSHIFT_NODEJS_PORT || "3000";
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
app.set('port', port);

var mongoose = require('mongoose');
mongoose.connect('mongodb://qdbuser:7p66vCDo@mongodb:' + process.env.MONGODB_PORT + '/qdb');

//schemas
var Question = require('./coreobjs/models/question');
var Lookups = require('./coreobjs/models/lookups');
var UpdateQuestion = require('./coreobjs/models/question');
var Employee = require('./coreobjs/models/employee');

//core business objects
var EvalObj = require('./coreobjs/corelogic/evaluate');


// ROUTES FOR OUR API
var router = express.Router();

//CORS issue 
router.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// middleware to use for all requests
router.use(function (req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
	res.send("<a href='/api/employees'>Show Employees</a><br/><br/><a href='/api/questions'>Show questions</a><br/><a href='/api/testfork'>Test Fork</a>");
});

///////////////////////////////////  authentication  /////////////////////////////
router.route('/register').post(AuthenticationController.register);
router.route('/login').post(AuthenticationController.login);
router.route('/protected').get( requireAuth, function(req, res){
        res.send({ content: 'Success'});
    });


 // authRoutes.post('/register', AuthenticationController.register);
 //   authRoutes.post('/login', requireLogin, AuthenticationController.login);
 
  //  authRoutes.get('/protected', requireAuth, function(req, res){
  //      res.send({ content: 'Success'});
  //  });


/////////////////////////////////////  POST QUESTIONS ////////////////////////////
router.route('/questions')
	.post(function (req, res) {
		console.log('qn post...' + req.body._id);
		var qn = new Question(req.body);
		try {
			qn.save(function (err, result) {
				if (err) {
					console.log('qn post error...' + req.body._id);
					res.send(err);
				}
				console.log('qn post success...', result);
				res.json(result);
			});
		}
		catch (e) {
			console.log('qn post exception...' + JSON.stringify(e));
		}
	});

/////////////////////////////////////  POST LOOKUPS ////////////////////////////
router.route('/lookups')
	.post(function (req, res) {
		try {
			console.log('lookups post...' + JSON.stringify(req.body));
			Lookups.findOne({ rev: 0 }, (err, lookups) => {
				if (err) {
					console.log('lookups post error...' + req.body._id);
					res.send(err);
				}
				lookups.lkups = undefined;
				lookups.lkups = req.body.lkups;
				lookups.save(function (err) {
					if (err) {
						console.log('lookups post error 2...' + req.body._id);
						res.send(err);
					}
					console.log('lookups post success...');
					//res.json(result);
					res.json({ message: 'Lookups updated!' });
				}); //end of save
			}); //end of fine one

		}
		catch (e) {
			console.log('lookups post exception...' + JSON.stringify(e));
		}
	});  //end of post
/////////////////////////////////////  END POST LOOKUPS ////////////////////////////

/////////////////////////////////////  GET  ////////////////////////////
router.route('/questions')
	.get(function (req, res, next) {
		// TODO future based on purpose and question type of the functionality return the result
		if (req.query._id != undefined) {
			console.log('qn id get...' + req.query._id);

			if (req.query._cnt == undefined) {
				req.query._cnt = 1
			}

			if (req.query._cnt != undefined && req.query._cnt == -1) {
				try {
					//if (modqns[0].typ ==1) {
					/*
										modqns[0].evda = undefined;
										modqns[0].anhi = undefined;
										modqns[0].evhi = undefined;
										modqns[0].mthi = undefined;
										modqns[0].ans = undefined;
										modqns[0].mtch = undefined;
					*/
					//var qn = new Question(modqns[0]);
					/*
										qn.save(function (err, result) {
									if (err) {
										console.log('qn post error...' + req.body._id);
										res.send(err);
									}
									console.log('qn update post success modqns[0]._id...', modqns[0]._id);
									console.log('qn update post success result._id...', result._id);
					
									res.json(result);
								});
					*/

					Question.update({ _id: req.query._id }, { $unset: { evda: 1, evhi: 1, anhi: 1, ans: 1, mtch: 1, mthi: 1 } }, function (error, result) {
						if (error) {
							//console.log('processed qn id update error...' + req.body._id);
							//res.sendStatus(err);
							res.send(500, { error: error });
						}
						res.json(result);
					});

					/*
								var options = { upsert: true, new: true, strict:false,  $unset: { evda : 1, evhi :1 } };
									UpdateQuestion.findOneAndUpdate({ _id: modqns[0]._id }, modqns[0], options, function (error, result) {
										if (error) {
											//console.log('processed qn id update error...' + req.body._id);
											//res.sendStatus(err);
											res.send(500, { error: error });
										}
										res.json(result);
									});
							*/
					//	}
				}
				catch (err2) {
					console.log('qn id processing exception...' + JSON.stringify(err2));
					next(err2);
					//res.sendStatus(err2);
				}
			}
			else if (req.query._cnt != undefined && req.query._cnt == -2) {
				Question.find({ _id: req.query._id }, (err, questions) => {
					if (err) {
						console.log('qn id get error..cnt=-2 ...' + req.query._id);
						res.sendStatus(err);
					}
					console.log('qn id succesful..cnt=-2 ...' + req.query._id);
					res.json(questions);
				});
			}
			else {
				var modqns;
				Question.find({ _id: req.query._id }, (err, questions) => {
					if (err) {
						console.log('qn id get error...' + req.query._id);
						res.sendStatus(err);
					}
					modqns = questions;
					//	modqns = questions;
					console.log('qn id processing start...');
					if (modqns[0].typ == 2) {
						try {
							let datarules = {}
							var getChoiceObj = new EvalObj.getChoices(modqns[0].ans, datarules);
							console.log('qn id equation choices...' + JSON.stringify(getChoiceObj));
							modqns[0].mtch = getChoiceObj.mtch;
							if (modqns[0].mthi) {
								modqns[0].mthi.push(modqns[0].mtch);
							}
							else {
								modqns[0].mthi = new Array;
								modqns[0].mthi.push(modqns[0].mtch);
							}
							console.log('qn id eval straight qn processing (mutliple choice generation successful...');
						}  //end try
						catch (err2) {
							console.log('qn id processing exception...' + JSON.stringify(err2));
							next(err2);
							//res.sendStatus(err2);
						}
					}
					else {
						for (let i = 0; i < req.query._cnt; i++) {
							try {
								var drng = modqns[0].drng ? modqns[0].drng : null;
								var usecase = modqns[0].usecase ? modqns[0].usecase : null;
								var parseEqnObj = new EvalObj.parseEquation(modqns[0].eqn, drng, usecase);
								console.log('qn id equation result...' + JSON.stringify(parseEqnObj));
								//var modqn = JSON.parse(JSON.stringify(question));
								modqns[0].evda = parseEqnObj.evda;  //retains last one
								//common
								if (modqns[0].evhi) {
									modqns[0].evhi.push(modqns[0].evda);
								}
								else {
									modqns[0].evhi = new Array;
									modqns[0].evhi.push(modqns[0].evda);
								}
								modqns[0].ans = parseEqnObj.ans;  //retains last one
								//only push to history if it is generated
								if (modqns[0].anhi) {
									modqns[0].anhi.push(modqns[0].ans);
								}
								else {
									modqns[0].anhi = new Array;
									modqns[0].anhi.push(modqns[0].ans);
								}

								//generatec choices
								var getChoiceObj = new EvalObj.getChoices(modqns[0].ans, drng);
								console.log('qn id equation choices...' + JSON.stringify(getChoiceObj));
								modqns[0].mtch = getChoiceObj.mtch;
								//only push to history if it is generated
								if (modqns[0].mthi) {
									modqns[0].mthi.push(modqns[0].mtch);
								}
								else {
									modqns[0].mthi = new Array;
									modqns[0].mthi.push(modqns[0].mtch);
								}
								console.log('qn id eval ' + i + ' processing successful...');
							}  //end try
							catch (err2) {
								console.log('qn id processing exception...' + JSON.stringify(err2));
								next(err2);
								//res.sendStatus(err2);
							}
						} //end for
					} //end type 1


					//step3: save updated question to database
					var query = {},

						options = { upsert: true, new: true };
					// Find the document
					UpdateQuestion.findOneAndUpdate({ _id: modqns[0]._id }, modqns[0], options, function (error, result) {
						if (error) {
							console.log('processed qn id update error...' + req.body._id);
							//res.sendStatus(err);
							res.send(500, { error: error });
						}

						//Replace question with evda
						for (let k = 0; k < result.desc.length; k++) {
							if (result.desc[k].p && result.desc[k].p.trim().length > 0) {
								result.desc[k].p = result.desc[k].p.replace(/\[(.*?)=(.*?)\]/g, function replacer(match, $1, $2) {
									return (result.evda[$1.trim()] + "").trim();
								});

								result.desc[k].p = result.desc[k].p.replace(/\[(.*?)\]/g, function replacer(match, $1) {
									return (result.evda[$1.trim()] + "").trim();
								});
							}
						}
						//Replace steps with evda
						if (result.steps) {
							for (let k = 0; k < result.steps.length; k++) {
								//description
								result.steps[k].desc = result.steps[k].desc.replace(/\[(.*?)=(.*?)\]/g, function replacer(match, $1, $2) {
									return (result.evda[$1.trim()] == undefined ? $1.trim() : (result.evda[$1.trim()] + "").trim());
								});

								result.steps[k].desc = result.steps[k].desc.replace(/\[(.*?)\]/g, function replacer(match, $1) {
									return (result.evda[$1.trim()] == undefined ? $1.trim() : (result.evda[$1.trim()] + "").trim());
								});

								//equation
								result.steps[k].eqn = result.steps[k].eqn.replace(/(\w+)/g, function replacer(match, $1) {
									return (result.evda[$1.trim()] == undefined ? $1.trim() : (result.evda[$1.trim()] + "").trim());
								});

							} //end of for
						} //end of if
						if (req.query._cnt == 1) {
							result.evda = undefined;
							result.anhi = undefined;
							result.evhi = undefined;
							result.mthi = undefined;
						}
						console.log('processed qn id update result...' + JSON.stringify(result));
						res.json(result);
					});
				}); //end of mongoose get
			}
		}
		else {
			next();
		}
	}); //end of qn get single request


router.route('/questions')
	.get(function (req, res, next) {
		if (req.query._sctid != undefined) {
			console.log('qns sctid get...' + req.query._sctid);
			var query = Question.find({ sct: req.query._sctid }); //.select('-evhi -anhi -mthi -eqn -drng');
			var qns;
			query.exec(function (err, qns) {
				if (err) {
					console.log('qns sctid get dberror...' + req.query._sctid);
					res.send(500, { error: err });
				}
				let skipqns = new Array;
				for (let qi = 0; qi < qns.length; qi++) {
					try {
						if (qns[qi].typ != 2) continue;  //simple question
						console.log('qns sctid processing...:_id:ObjectId("' + qns[qi]._id + '")');
						let datarules = {}
						var getChoiceObj = new EvalObj.getChoices(qns[qi].ans, datarules);
						console.log('qns sctid equation choices...' + JSON.stringify(getChoiceObj));
						qns[qi].mtch = getChoiceObj.mtch;
					}
					catch (err2) {
						console.log('qns sctid equation choices exception....');
						next(err2);
					}
				}
				for (let qi = 0; qi < qns.length; qi++) {
					try {
						if (qns[qi].typ != 1) continue;   //equation question
						console.log('qns sctid processing...:_id:ObjectId("' + qns[qi]._id + '")');
						//console.log('qns sctid processing...:' + qi);
						//step1: get question from DB

						//step2: process question from DB
						var drng = qns[qi].drng ? qns[qi].drng : null;
						var usecase = qns[qi].usecase ? qns[qi].usecase : null;
						console.log('qns sctid processing input eqn ...' + JSON.stringify(qns[qi].eqn));
						console.log('qns sctid processing input drng ...' + JSON.stringify(drng));
						var parseEqnObj = new EvalObj.parseEquation(qns[qi].eqn, drng, qns[qi].usecase);
						console.log('qns sctid equation output result...' + JSON.stringify(parseEqnObj));
						qns[qi].evda = parseEqnObj.evda;
						qns[qi].ans = parseEqnObj.ans;
						//if user already provided the answer do not update from processing. it is dummy to get the data
						if (qns[qi].usecase && qns[qi].usecase == 1) {
							//nothing
						}
						else {
							var getChoiceObj = new EvalObj.getChoices(qns[qi].ans, drng);
							qns[qi].mtch = getChoiceObj.mtch;
						}  //end use case
					} //end try
					catch (err2) {
						if (qns[qi].anhi) {
							console.log('qns sctid processing exception..history.id:' + qns[qi].id + '  error:' + err2.toString());
							let max = qns[qi].anhi.length;
							let rnd = Math.floor(Math.random() * max);
							qns[qi].ans = qns[qi].anhi[rnd];
							qns[qi].evda = qns[qi].evhi[rnd];
							qns[qi].mtch = qns[qi].mthi[rnd];
						}
						else {
							console.log('qns sctid processing exception..skipping..id:' + qns[qi].id + '  error:' + err2.toString());
							skipqns.push(qi);
							continue;
						}
						//next(err2);
					}

					//Replace question with evda
					for (let k = 0; k < qns[qi].desc.length; k++) {
						qns[qi].desc[k].p = qns[qi].desc[k].p.replace(/\[(.*?)=(.*?)\]/g, function replacer(match, $1, $2) {
							return (qns[qi].evda[$1.trim()] + "").trim();
						});

						qns[qi].desc[k].p = qns[qi].desc[k].p.replace(/\[(.*?)\]/g, function replacer(match, $1) {
							return (qns[qi].evda[$1.trim()] + "").trim();
						});
					}

					//Replace steps with evda
					if (qns[qi].steps) {
						for (let k = 0; k < qns[qi].steps.length; k++) {
							//description
							qns[qi].steps[k].desc = qns[qi].steps[k].desc.replace(/\[(.*?)=(.*?)\]/g, function replacer(match, $1, $2) {
								return (qns[qi].evda[$1.trim()] == undefined ? $1.trim() : (qns[qi].evda[$1.trim()] + "").trim());
							});

							qns[qi].steps[k].desc = qns[qi].steps[k].desc.replace(/\[(.*?)\]/g, function replacer(match, $1) {
								return (qns[qi].evda[$1.trim()] == undefined ? $1.trim() : (qns[qi].evda[$1.trim()] + "").trim());
							});

							//equation
							qns[qi].steps[k].eqn = qns[qi].steps[k].eqn.replace(/(\w+)/g, function replacer(match, $1) {
								return (qns[qi].evda[$1.trim()] == undefined ? $1.trim() : (qns[qi].evda[$1.trim()] + "").trim());
							});
						} //end of for
					} //end of if
					//console.log('..out result question:' + qi + '...' + JSON.stringify(qns[qi]));
				} //end of qns for

				////////////////////////////////////////////////////////
				if (skipqns.length > 0) {
					let newqns = new Array;
					for (let qi = 0; qi < qns.length; qi++) {
						for (let qj = 0; qj < skipqns.length; qj++) {
							if (qi != skipqns[qj]) {
								qns[qi].evda = undefined;
								qns[qi].anhi = undefined;
								qns[qi].evhi = undefined;
								qns[qi].mthi = undefined;
								qns[qi].drng = undefined;
								qns[qi].eqn = undefined;
								newqns.push(qns[qi]);
							}
						}
					}
					console.log('qns sctid get result...' + JSON.stringify(newqns));
					res.json(newqns);
				}
				else {
					for (let qi = 0; qi < qns.length; qi++) {
						for (let qj = 0; qj < skipqns.length; qj++) {
							qns[qi].evda = undefined;
							qns[qi].anhi = undefined;
							qns[qi].evhi = undefined;
							qns[qi].mthi = undefined;
							qns[qi].drng = undefined;
							qns[qi].eqn = undefined;
						}
					}
					console.log('qns sctid get result...' + JSON.stringify(qns));
					res.json(qns);
				}
			});  //end of query.exec
		}
		else {
			next();
		}
	}); //end of express get

router.route('/questions')
	.get(function (req, res, next) {
		if (req.query && (req.query._id || req.query._sctid)) {
			next();
		}
		else {
			console.log('qns all get...');
			var query = Question.find({}).sort({ updatedAt: -1 }).select('-evhi -anhi -mthi');
			query.exec(function (err, questions) {
				if (err) {
					res.send(500, { error: err });
					//return next(err);
				}
				res.json(questions);
			});
		}
	});

///LOOKUPS GET
router.route('/lookups')
	.get(function (req, res) {
		// TODO future based on purpose and question type of the functionality return the result
		if (req.query.rev != undefined) {
			console.log('..get lookups rev#...' + req.query.rev);
			var query = Lookups.find({ rev: req.query.rev }).select('lkups');
			query.exec(function (err, lkups) {
				if (err) return next(err);
				res.json(lkups[0]);
			});

		}
		else {
			Lookups.find({}, (err, lookups) => {
				console.log('..questions.find start...');
				if (err) {
					res.send(500, { error: err });
				}
				res.json(lookups);
				console.log('..questions.find end...');

			});
		}
	}); //end of express get

/////////////////////////////////////  END GET  ////////////////////////////


//////////////////////////PUT PUT //////////////////////////////////////////////
router.route('/questions')
	.put(function (req, res) {
		console.log('qn update id..' + req.body._id);
		var query = {}, options = { upsert: true, new: true };
		// Find the document
		Question.findOneAndUpdate({ _id: req.body._id }, req.body, options, function (error, result) {
			if (error) {
				res.send(500, { error: error });
			}
			result.anhi = undefined;
			result.evhi = undefined;
			res.json(result);
		});
	});

router.route('/questions')
	.delete(function (req, res) {
		console.log('qn delete..', req.body);
		var qn = new Question(req.body);
		qn.remove({
			_id: qn._id
		}, function (err, Question) {
			if (err)
				res.send(err);
			res.json({ message: 'Successfully deleted' });
		});
	});

// ----------------------------------------------------
router.route('/employees')
	// create a Employee (accessed at POST http://localhost:8080/Employees)
	.post(function (req, res) {
		console.log('..post.', req.body);
		var employee = new Employee(req.body);		// create a new instance of the Employee model
		employee.save(function (err) {
			if (err)
				res.send(err);

			res.json({ message: 'Employee created!' });
		});


	})
	.put(function (req, res) {
		console.log(' emp id' + req.body._id);
		console.log(' req body' + JSON.stringify(req.body));

		Employee.update({ _id: req.body._id }, req.body, { multi: false },
			function (error, rowsAffected) {
				if (error) {
					res.send(500, { error: error });
				}
				else if (rowsAffected == 0) {
					res.send(500, { error: "No rows affected" });
				}
				else {
					res.send(200);
				}
			}
		);
	})
	.delete(function (req, res) {
		console.log('..delete.', req.body);

		var employee = new Employee(req.body);
		employee.remove({
			_id: employee._id
		}, function (err, Employee) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	})


	// get all the Employees (accessed at GET http://localhost:8080/api/Employees)
	.get(function (req, res) {
		// res.json({ message: '...hooray! welcome to our api!' });
		console.log('..get.http://localhost:80/api/Employees...');


		Employee.find({}, (err, employees) => {
			console.log('..Employee.find...');

			if (err) {
				//return next(err);
				//res.send(err);
				//throw err;
			}
			res.json(employees);
			console.log('..Employee.find end...');

		});
	});


router.route('/users')

	.get(function (req, res) {
		User.find({}, function (err, docs) {
			res.json(docs);
		});
	});

// ----------------------------------------------------
router.route('/employees/:employee_id')

	// get the Employee with that id
	.get(function (req, res) {
		Employee.findById(req.params.employee_id, function (err, Employee) {
			if (err)
				res.send(err);
			res.json(Employee);
		});
	})

	// update the Employee with this id
	.put(function (req, res) {
		console.log(' emp id' + req.params.employee_id);
		console.log(' req body' + JSON.stringify(req.body));

		Employee.update({ _id: req.params.employee_id }, req.body, { multi: false },
			function (error, rowsAffected) {
				if (error) {
					res.send(500, { error: error });
				}
				else if (rowsAffected == 0) {
					res.send(500, { error: "No rows affected" });
				}
				else {
					res.send(200);
				}
			}
		);
	})

	// delete the Employee with this id
	.delete(function (req, res) {
		Employee.remove({
			_id: req.params.employee_id
		}, function (err, Employee) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});


// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

//////////////////////////////////////// UTILITY  FUNCTIONS //////////////////////////////////////
isPropExists = function (key) {
	for (let key2 in QnObjMode) {
		if (QnObjMode.hasOwnProperty(key2)) {
			if (key == key2) {
				console.log("key exists..." + key);
				return true;
			}
		}
	}
	console.log("key not exists..." + key);
	return false;
}
