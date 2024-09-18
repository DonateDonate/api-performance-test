
import http from 'k6/http';
import {check,sleep } from 'k6';

//const BASE_URL = 'http://host.docker.internal:8080';
//const BASE_URL = 'http://localhost:8080';
const BASE_URL = 'http://sanha-api.shop:8080';
//const BASE_URL = "http://ec2-3-34-255-150.ap-northeast-2.compute.amazonaws.com:8080";


// export const options = {
//     vus : 114,
//     duration : '1s'
// }

export const options = {
    stages: [
        { duration: '1s', target: 200 }, 
        {duration : "10s", target : 200},
        { duration: '1s', target: 0 },
      ]
};

export default function () {
    let signupRes = http
        .get(`${BASE_URL}/test/ping`)

    check(signupRes,{
        'test status is 200': (r) => r.status === 200
    });

    if(signupRes.status !==200){
        console.log("status = "+ signupRes.status);
    }
    sleep(1);
}