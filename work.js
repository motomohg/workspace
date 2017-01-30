var express = require('express'); 
var app = express(); 
var bodyParser = require('body-parser');
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx_buffer_json");
var json2xls = require("json2xls");
app.use(bodyParser.json());
app.use(json2xls.middleware);
var storage = multer.memoryStorage();
var upload = multer({ storage: storage }).single('file');
var pg = require('pg');
var connectionString = process.env.DATABASE_URL;
var client = new pg.Client(connectionString);
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
				// for(var i=0;i<result.length;i++){
					 // console.log(result[i].lname);
				// }
				updatePg(result,res);
				// res.json({error_code:0,err_desc:null, data: result});
			});
		} catch (e){
			res.json({error_code:1,err_desc:"Corupted excel file"});
		}
	})
}); 

function updatePg(input,res){
var results = [];
	pg.connect(connectionString, function(err, client, done){
			// // Handle connection errors
			if(err) {
				done();
				console.log(err);
				res.status(500).json({success: false, data: err});
			}
			
			// SQL Query > Insert Data
			for(var i=0;i<input.length;i++){
				//console.log(input[i].lname,input[i].fname);
				client.query('INSERT INTO table1(col1, col2) values($1, $2)',[input[i].lname,input[i].fname]);
				break;
			}
			
			// SQL Query > Select Data
			const query = client.query('SELECT * FROM table1');
			// Stream results back one row at a time
			query.on('row',function(row){
				results.push(row);
			});
			// After all data is returned, close connection and return results
			query.on('end', function(){
				done();
				res.end(JSON.stringify(results));
			});
		});

}


app.get('/userDetails',function(req,res){
	getUserDetails(res);
});

app.get('/xlsx',function(req,res){
	var jsonArr = [{
		"tableid" : "60",
		"col1" : "Velusamy",
		"col2" : "Mohan"
	}, {
		"tableid" : "61",
		"col1" : "Sharma",
		"col2" : "Raushan"
	}, {
		"tableid" : "62",
		"col1" : "Witt",
		"col2" : "Mike"
	}
];
	 res.xls('data.xlsx', jsonArr);
});

function getUserDetails(res){
	var results = [];
	pg.connect(connectionString, function(err, client, done){
			// // Handle connection errors
			if(err) {
				done();
				console.log(err);
				res.status(500).json({success: false, data: err});
			}
			
			// SQL Query > Select Data
			const query = client.query('SELECT * FROM table1');
			// Stream results back one row at a time
			query.on('row',function(row){
				results.push(row);
			});
			// After all data is returned, close connection and return results
			query.on('end', function(){
				done();
			//	res.end(JSON.stringify(results));
				 res.xls('data.xlsx', results);
			});
	});

}


app.get('/',function(req,res){
	res.sendFile(__dirname + "/index.html");
});




app.listen(process.env.VCAP_APP_PORT);
/* app.listen('3000', function(){
	 console.log('running on 3000..');
 });*/