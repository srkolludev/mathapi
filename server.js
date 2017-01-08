// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
var morgan     = require('morgan');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/qtcemp', express.static(path.join(__dirname, 'qtcapp/www')));

//var port = process.env.PORT || 8080; // set our port

var port = process.env.OPENSHIFT_NODEJS_PORT || "3000";
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

app.set('port', port);

var mongoose   = require('mongoose');
//mongoose.connect('mongodb://node:node@novus.modulusmongo.net:27017/Iganiq8o'); // connect to our database
mongoose.connect('mongodb://localhost/EmployeeDB');
var Employee     = require('./app/models/Employee');

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = express.Router();

//var webrouter = express.Router();

// middleware to use for all requests
//webrouter.use(function (req, res, next) {
    // do logging
   // console.log('Something is happening.');
   // next();
//});

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
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
	res.json({ message: 'hooray! welcome to our api!' });	
});

// on routes that end in /Employees
// ----------------------------------------------------
router.route('/employees')

	// create a Employee (accessed at POST http://localhost:8080/Employees)
	.post(function(req, res) {
	    console.log('..post.', req.body);
		var employee = new Employee(req.body);		// create a new instance of the Employee model
		//employee= req.body;  // set the Employees name (comes from the request)

		employee.save(function (err) {
			if (err)
				res.send(err);

			res.json({ message: 'Employee created!' });
		});

		
	})

	// get all the Employees (accessed at GET http://localhost:8080/api/Employees)
	.get(function (req, res) {
	   // res.json({ message: '...hooray! welcome to our api!' });
	  //  console.log('..get.http://localhost:8080/api/Employees...');
		Employee.find(function(err, Employees) {
			if (err)
				res.send(err);

			res.json(Employees);
		});
	});

// on routes that end in /Employees/:Employee_id
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
	 //   Employee.findById(req.params.Employee_id, function (err, Employee) {


		   // res.json({ message: 'Employee updated!' + req.body });

		//	if (err)
		//		res.send(err);

			//var Employee_instance = new Employee();		// create a new instance of the Employee model
	    //Employee_instance.name = req.body.name;
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

		//	Employee_instance.update({ _id: req.params.Employee_id }, {name: req.body.name }, {}, function (err, result) {
		//		if (err)
		//			res.send(err);

		//		res.json({ message: 'Employee updated!' });
		//	});

	//	});
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
