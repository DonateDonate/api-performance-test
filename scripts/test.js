
import http from 'k6/http';
import {check,sleep } from 'k6';

const BASE_URL = 'http://host.docker.internal:8080';
//const BASE_URL = 'http://localhost:8080';


// export const options = {
//     vus : 114,
//     duration : '1s'
// }

export const options = {
    scenarios: {
        spike: {
            executor: 'constant-vus',
            vus: 200,
            duration: '1s',
        },
    }
};

export default function () {
    let signupRes = http
        .get(`${BASE_URL}/test/ping`)

    check(signupRes,{
        'signup status is 200': (r) => r.status === 200
    });

    sleep(1);
}