var express = require('express'); 
var app = express(); 
var bodyParser = require('body-parser');
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
app.use(bodyParser.json());
var storage = multer.memoryStorage();
var upload = multer({ storage: storage }).single('file');
var pg = require('pg');
   
/** API path that will upload the files */
app.post('/upload', function(req, res) {
	var exceltojson;
	upload(req,res,function(err){
		if(err){
			 res.json({error_code:1,err_desc:err});
			 return;
		}
		/** Multer gives us file info in req.file object */
		//console.log('mohg-->'+req.file);
		if(!req.file){
			res.json({error_code:1,err_desc:"No file passed"});
			return;
		}
		/** Check the extension of the incoming file and 
		 *  use the appropriate module
		 */
		if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
			exceltojson = xlsxtojson;
		} else {
			exceltojson = xlstojson;
		}
		var obj={input: req.file.buffer};
	//	console.log(typeof req.file.buffer);
		// console.log(obj.input instanceof Buffer);
		try {
			exceltojson({
				input: req.file.buffer,
				output: null, //since we don't need output.json
				lowerCaseHeaders:true
			}, function(err,result){
				if(err) {
					return res.json({error_code:1,err_desc:err, data: null});
				} 
				for(var i=0;i<result.length;i++){
					 console.log(result[i].lname);
				}
				res.json({error_code:0,err_desc:null, data: result});
			});
		} catch (e){
			res.json({error_code:1,err_desc:"Corupted excel file"});
		}
	})
}); 
app.get('/',function(req,res){
	res.sendFile(__dirname + "/index.html");
});
app.listen(process.env.VCAP_APP_PORT);
// app.listen('3030', function(){
	// console.log('running on 3000..');
// });