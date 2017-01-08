var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var EmployeeSchema   = new Schema({
    name: String,
    phone: String,
    phoneAlt: String,
    email: String,
    reportsTo: String,
    role: String,
    expertize: Array,
    applications: Array,
    team: String,
    hiredOn: Date,
    created: Date,
    modified: Date
});

module.exports = mongoose.model('employee', EmployeeSchema);