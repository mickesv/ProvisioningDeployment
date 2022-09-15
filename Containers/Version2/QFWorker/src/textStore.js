var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var textStoreSchema = new Schema({
    name : String,
    startLine : Number,
    contents : String
});

module.exports = mongoose.model('textStore', textStoreSchema);
