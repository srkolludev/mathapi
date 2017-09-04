var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

//var QuestionSchema   = new Schema({Schema.Types.Mixed);
//var EmployeeSchema   = new Schema({
   
//});

var QnObj = {
    typ:Number,
    usecase:Number,
    desc: Schema.Types.Mixed,
    ans: Schema.Types.Mixed, //[String],
    eqn: String,
    steps: Schema.Types.Mixed,  //[Schema.Types.Mixed],
    drng:  Schema.Types.Mixed,
    tpl: String,
    proc: String,
    chty:Schema.Types.Mixed, //[String],
    mtch:Schema.Types.Mixed, //[String],
    grd: Schema.Types.Mixed, //[Number],
    cat: Number,
    sct: Number,
    area: Schema.Types.Mixed, //[Number],
    	exam: Schema.Types.Mixed, //[Number],
    	lvl:Schema.Types.Mixed, //[Number],
	et:Schema.Types.Mixed,
//worksheet specific
   	 cnt:Number,
    	aloc:Number,
    	rpn:Number,
	dsmi:Number,
	dsma:Number,
	osmil:Number,
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

var QuestionSchema =  new Schema(QnObj,{timestamps: true} );

//var QuestionSchema = new Schema({ any: Schema.Types.Mixed });

module.exports = mongoose.model('questions',QuestionSchema);