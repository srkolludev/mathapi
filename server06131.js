// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
var morgan =require('morgan');

// configure app
app.use(morgan('dev')); // log requests to the console

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

var mongoose   = require('mongoose');
mongoose.connect('mongodb://qdbuser:7p66vCDo@mongodb:' +  process.env.MONGODB_PORT + '/qdb');

//schemas
var Question = 	require('./coreobjs/models/question');
var Lookups = 	require('./coreobjs/models/lookups');
var UpdateQuestion = 	require('./coreobjs/models/question');
var Employee = 	require('./coreobjs/models/employee');
var async = require('async')

//core business objects
var EvalObj  = require('./coreobjs/corelogic/evaluate');

// ROUTES FOR OUR API
// =============================================================================
// create our router
var router = express.Router();

//CORS issue 
router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods" , "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
 res.send("<a href='/api/employees'>Show Employees</a><br/><br/><a href='/api/questions'>Show questions</a>");
});


/////////////////////////////////////  POST QUESTIONS ////////////////////////////
router.route('/questions')
	.post(function(req, res) {
	    console.log('qn update id..' + req.body._id);
		var qn = new Question(req.body);
	     try {
			qn.save(function (err,result) {
			if (err) res.send(err);
			console.log('..post.', req.body);
 			res.json(result);
			//res.json({ message: 'Quetsion created!' });
			});
			}
	     catch(e) {
		console.log('..ignoring error..');		
		}
});
//TODO save last 5 revisions
router.route('/lookups')
	.post(function(req, res) {
	  //  console.log('qn update id..' + req.body._id);
		//var lkup = new Lookups(req.body);
	     try {
console.log('lookup update body..' + JSON.stringify(req.body));

Lookups.findOne({rev:0}, (err, lookups) => {
  if (err) {
	//return next(err);
	//res.sendStatus(err);
	throw err;
	}
console.log('lookup findOne..' + JSON.stringify(lookups));
lookups.lkups = undefined;
lookups.lkups = req.body.lkups;
			lookups.save(function (err) {
			if (err) res.send(err);
			console.log('..post.', req.body);
 			//res.json(result);
			res.json({ message: 'Lookups updated!' });
			}); //end of save

}); //end of fine one

		}
	     catch(e) {
		console.log('..ignoring error..');		
		}

});  //end of post



/////////////////////////////////////  END POST ////////////////////////////
ProcessTestQuestion = function(req,res) {
 console.log('..req.query._id... ' + req.query._id);
    var modqns;
	Question.find({_id:req.query._id}, (err, questions) => {

  if (err) {
	//return next(err);
	res.sendStatus(err);
	throw err;
	}
modqns= questions;
console.log('..Question.find...');
//step1: get question from DB

//step2: process question from DB
 console.log('..process question start...');
var drng = modqns[0].drng ? modqns[0].drng : null; 
var parseEqnObj = new EvalObj.parseEquation(modqns[0].eqn,drng);
 console.log('..parseEqnObj...'+ JSON.stringify(parseEqnObj));
//var modqn = JSON.parse(JSON.stringify(question));
modqns[0].evda = parseEqnObj.evda;
modqns[0].ans = parseEqnObj.ans;

 console.log('..process question end...');
 console.log('..updated question:...' + JSON.stringify(modqns));
//step3: save updated question to database
	UpdateQuestion.update({ _id: modqns[0]._id }, modqns[0], { multi: false },
        function (error, rowsAffected) {
            if (error) {
                res.send(500, { error: error });
            }
            else if (rowsAffected == 0) {
                res.sendStatus(500, { error: "No rows affected" });
            }
            else {
                res.sendStatus(200);
            }

		res.json(modqns);

        }); //end of mongoose update 

//step4: return mod questions
    //return modqns;

}); //end of mongoose get

}; //end of ProcessTestQuestion 

Transform  = function(qn) {
console.log('..qn...'+ JSON.stringify(qn));
console.log('..QnObjMode...'+ JSON.stringify(QnObjMode));
//var newqnArr = new Array;
//var newqn = {};
for (let key in qn[0]) {
  if (qn[0].hasOwnProperty(key)) {
console.log("deleting..." + key);

 if (!isPropExists(key)) {
	console.log("deleting..." + key);
	delete qn[0][key];
	console.log("deleting..." + key);
}
}
}
console.log('..sliced qn...'+ JSON.stringify(qn));
return qn;
}

isPropExists = function(key) {
for (let key2 in QnObjMode) {
if (QnObjMode.hasOwnProperty(key2)) {
 if (key==key2) {
console.log("key exists..." + key);
 return true;
}
}
}
console.log("key not exists..." + key);
return false;
}

/*
var selQnObj = {
    typ:1,
    desc: 1,
    ans: 1
    eqn: 1,
    steps: 1,  
    drng:  1,
    tpl: 1,
    proc: 1,
    chty:1, 
    mtch:0,
    grd: 1,
    cat: 1,
    sct: 1,
    area: 1,
    	exam: 1,
    	lvl:1,
	et:1,
//worksheet specific
   	 cnt:1,
    	aloc:1,
    	rpn:1,
	dsmi:1,
	dsma:1,
	osmil:1,
	osmal:Number,
	osmir:Number,
	osmar:Number,
	oprn:Schema.Types.Mixed, //[String],
	subq:Schema.Types.Mixed, //[Schema.Types.Mixed],
//dynamically added
	//ans update dynamically
	evda:Schema.Types.Mixed,  //evaluated data of variables and steps
	evhi:Schema.Types.Mixed, //[Schema.Types.Mixed], //evaluated history data of variables and steps
	anhi:Schema.Types.Mixed, //[Schema.Types.Mixed],  //answer history
	mthi:Schema.Types.Mixed, //[Schema.Types.Mixed],  //multiple choice histoty
   	cu: String, //created user
    	mu: String,
    	cd: Date,
    	md: Date
};
*/

/////////////////////////////////////  GET  QUESTION BY QUESTION ID////////////////////////////

router.route('/questions')
    .get(function (req, res) {
        // TODO future based on purpose and question type of the functionality return the result
        var queryObj;

        if (req.query._id != undefined) {
            queryObj = { _id: req.query._id };
        }
        else if (req.query._sctid != undefined) {
            queryObj = { sct: req.query._sctid }
        }
        else {
            queryObj = {};
        }
        console.log('..question.process start...' + JSON.stringify(queryObj));

        var qns;

        //////////////////////////GET QUESTIONS BY SUB CATEGORY ID //////////////////////////////////////////////////
        //step1: get question from DB
        var query;
        if (req.query._id == undefined && req.query._sctid == undefined) {
            query = Question.find(queryObj).select('-evhi -anhi -mthi -eqn -drng');
        }
        else {
            query = Question.find(queryObj);
        }
        var qns;
        query.exec(function (err, qns) {
            //error 
            if (err) return next(err);
            //qns regular
            if (req.query._id == undefined && req.query._sctid == undefined) {
                return res.json(qns);
            }
            //otherwise process
            for (let qi = 0; qi < qns.length; qi++) {
                if (qns[qi].typ != 2) continue;
                try {
                    console.log('..process simple question start...');
                    //step2: process question from DB
                    let datarules = {}
                    var getChoiceObj = new EvalObj.getChoices(qns[qi].ans, datarules);
                    qns[qi].mtch = getChoiceObj.mtch;
                }
                catch (err2) {
                    console.log('..err2 EvalOb.getChoices...' + JSON.stringify(err2));
                }
            }

            //qns equation
            for (let qi = 0; qi < qns.length; qi++) {
                if (qns[qi].typ != 1) continue;

                try {
                    //step2: process question from DB
                    console.log('..process question start...');
                    var drng = qns[qi].drng ? qns[qi].drng : null;
                    var parseEqnObj = new EvalObj.parseEquation(qns[qi].eqn, drng);
                    console.log('..parseEqnObj...' + JSON.stringify(parseEqnObj));
                    qns[qi].evda = parseEqnObj.evda;
                    qns[qi].ans = parseEqnObj.ans;
                    qns[qi].mtch = parseEqnObj.mtch;

                    if (qns[qi].evhi) {
                        qns[qi].evhi.push(qns[qi].evda);
                    }
                    else {
                        qns[qi].evhi = new Array;
                        qns[qi].evhi.push(qns[qi].evda);
                    }

                    if (qns[qi].anhi) {
                        qns[qi].anhi.push(qns[qi].ans);
                    }
                    else {
                        qns[qi].anhi = new Array;
                        qns[qi].anhi.push(qns[qi].ans);
                    }

                    if (qns[qi].mthi) {
                        qns[0].mthi.push(qns[qi].mtch);
                    }
                    else {
                        qns[qi].mthi = new Array;
                        qns[qi].mthi.push(qns[qi].mtch);
                    }

                }
                catch (err2) {
                    console.log('..err2 parseEqnObj...' + JSON.stringify(err2));
                    res.sendStatus(err2);
                    throw err2;
                }
                console.log('..process question end...');
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

                if (req.query._id != undefined) {  //one object update
                    var options = { upsert: true, new: true };
                    UpdateQuestion.findOneAndUpdate({ _id: qns[0]._id }, qns[0], options, function (error, result) {
                        if (error) {
                            res.send(500, { error: error });
                        }
                        result.evda = undefined;
                        result.anhi = undefined;
                        result.evhi = undefined;
                        result.mthi = undefined;
                        result.drng = undefined;
                        result.eqn = undefined;
                        console.log('..out result question:...' + JSON.stringify(result));
                        res.json(result);
                    }); //end of qns for
                }
            }

            ////////////////////////////////////////////////////////
            for (let qi = 0; qi < qns.length; qi++) {
                qns[qi].evda = undefined;
                qns[qi].anhi = undefined;
                qns[qi].evhi = undefined;
                qns[qi].mthi = undefined;
                qns[qi].drng = undefined;
                qns[qi].eqn = undefined;
            }
            res.json(qns);
      }); //end of qns for


}); //end of express get

///////////////////////////////////////////////////////////////////////////////////////////////
///LOOKUPS GET

router.route('/lookups')
	.get(function (req, res) {

// TODO future based on purpose and question type of the functionality return the result




if (req.query.rev != undefined) {
 console.log('..get lookups rev#...' + req.query.rev);
var query = Lookups.find({rev:req.query.rev}).select('lkups');
query.exec(function (err, lkups) {
        if (err) return next(err);
	//for(let i=0; i<lkups.length; i++

       res.json(lkups[0]);
    });

}
else {
Lookups.find({}, (err, lookups) => {
			 console.log('..questions.find start...');

			if (err) {
				//return next(err);
				//res.send(err);
				//throw err;
				}
			res.json(lookups);
 			console.log('..questions.find end...');

	});
}


}); //end of express get

/////////////////////////////////////  END GET  ////////////////////////////


//////////////////////////PUT PUT /////////////////////////////
router.route('/questions')
	.put(function(req, res) {
	    console.log('qn update id..' + req.body._id);
	    console.log(' qn req body' + JSON.stringify(req.body));

var query = {},
    //update = { expire: new Date() },
   // options = { upsert: true, new: true, setDefaultsOnInsert: true };
    options = { upsert: true, new: true };


// Find the document
Question.findOneAndUpdate({ _id: req.body._id }, req.body, options, function(error, result) {
    if (error) {
                res.send(500, { error: error });
            }

result.anhi = undefined; 
result.evhi = undefined; 
 res.json(result);

    // do something with the document
});

/*
	Question.update({ _id: req.body._id }, req.body, { multi: false },
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
        });
*/
});

router.route('/questions')
.delete(function(req, res) {
  console.log('qn delete..', req.body);
	var qn = new Question(req.body);	
		qn.remove({
			_id: qn._id
		}, function(err, Question) {
			if (err)
				res.send(err);
			res.json({ message: 'Successfully deleted' });
		});
	});



// ----------------------------------------------------
router.route('/employees')

	// create a Employee (accessed at POST http://localhost:8080/Employees)
	.post(function(req, res) {
	    console.log('..post.', req.body);
		var employee = new Employee(req.body);		// create a new instance of the Employee model
			employee.save(function (err) {
			if (err)
				res.send(err);

			res.json({ message: 'Employee created!' });
		});

		
	})
	.put(function(req, res) {
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
	.delete(function(req, res) {
  console.log('..delete.', req.body);

		var employee = new Employee(req.body);	
		employee.remove({
			_id: employee._id
		}, function(err, Employee) {
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
	.get(function(req, res) {
		Employee.findById(req.params.employee_id, function(err, Employee) {
			if (err)
				res.send(err);
			res.json(Employee);
		});
	})

	// update the Employee with this id
	.put(function(req, res) {
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
	.delete(function(req, res) {
		Employee.remove({
			_id: req.params.employee_id
		}, function(err, Employee) {
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
