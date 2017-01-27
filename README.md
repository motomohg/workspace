This app can be used to upload excel and update its contents in postgres db.
Uploaded will not be stored in any temp directory, instead we are using multer in-memory storage to store and parse the excel file to buffer. This buffer is sent to one node module which gives list of js objects as output. I'm using that output to update my db table
