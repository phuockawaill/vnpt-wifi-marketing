import { HTTP } from 'meteor/http';
Meteor.methods({
    rlts_baseStation_updatePosition(_id, data){
        let future = new Future();
        HTTP.get('http://118.69.65.208:2001/rtls/setpos?baseid='+_id+'&basepos='+data.lat+','+data.lng+',200&token='+TokenRLTS, (err, res)=>{
            if(err){
                future.throw('Request err!');
            } else {
                future.return(res);
            }
        });
        return future.wait();
    }
});
