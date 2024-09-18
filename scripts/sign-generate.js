
import http from 'k6/http';
import {check,sleep } from 'k6';

const BASE_URL = 'http://sanha-api.shop:8080';

export const options = {
    scenarios: {
        spike: {
            executor: 'constant-vus',
            vus: 1,
            duration: '1s',
        },
    },
};

function createUser() {
    return {
        identity: generateUniqueUsername(),
        password: '1234'
    };
}

export default function () {
for(let i=0; i<10; i++){
        for(let j=0; j<5; j++){
            let id = "010777777"+i+j;
            let signupRes = http
                .post(`${BASE_URL}/members`, JSON.stringify({
                    identity: id,
                    password: 1234
            }), {
                    headers : {'Content-Type' : 'application/json'}
            });

            check(signupRes,{
                'signup status is 200': (r) => r.status === 200
            });
        }
    }
}
