
const http=require('http');
http.createServer(
    function(req,resp){

        resp.end('Hello Node!!');

    }

).listen(3000,'127.0.0.1',function(){
    console.log('Server listening port 3000');
})