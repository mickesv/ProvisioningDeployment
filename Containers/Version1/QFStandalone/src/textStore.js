var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var textStoreSchema = new Schema({
    name : String,
    startLine : Number,
    contents : String
});

textStoreSchema.index({ contents: 1});

module.exports = mongoose.model('textStore', textStoreSchema);
