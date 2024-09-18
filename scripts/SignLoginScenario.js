
import http from 'k6/http';
import {check,sleep } from 'k6';

// 랜덤 11자리 사용자 이름 생성 함수
function generateRandomUsername() {
    const prefix = '010';
    const randomNumber = Math.floor(Math.random() * 100000000); // 0부터 99999999까지 랜덤 숫자 생성
    const paddedNumber = String(randomNumber).padStart(8, '0'); // 숫자를 8자리로 패딩
    return `${prefix}${paddedNumber}`;
}

let usedUsernames = new Set();

function generateUniqueUsername() {
    let username;
    do {
        username = generateRandomUsername();
    } while (usedUsernames.has(username));
    usedUsernames.add(username);
    return username;
}

const BASE_URL = 'http://sanha-api.shop:8080';

export const options = {
    scenarios: {
        spike: {
            executor: 'constant-vus',
            vus: 200,
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
    let user = createUser();

    let signupRes = http
        .post(`${BASE_URL}/members`, JSON.stringify({
            identity: user.identity,
            password: user.password
    }), {
            headers : {'Content-Type' : 'application/json'}
    });

    check(signupRes,{
        'signup status is 200': (r) => r.status === 200
    });

    let loginRes = http
        .post(`${BASE_URL}/login`, JSON.stringify({
            identity: user.identity,
            password: user.password
        }), {
            headers : {'Content-Type' : 'application/json'}
        });
    
    let accessToken = loginRes.headers['Authorization'];
    check(loginRes,{
        'login status is 200': (r) => r.status === 200 ,
        'login response contains token': (r) => accessToken !== undefined && accessToken !== ''
    });

    let authCheckRes = http.get(`${BASE_URL}/auth`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken
        }
    });
    
    check(authCheckRes,{
        'auth check status is 200': (r) => r.status === 200
    });
    sleep(1);
}
