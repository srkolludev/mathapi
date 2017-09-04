var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var LkupObj = {
    rev:Number,
    lkups: Schema.Types.Mixed,
};

var LookupsSchema =  new Schema(LkupObj ,{timestamps: true} );

module.exports = mongoose.model('lookups',LookupsSchema);