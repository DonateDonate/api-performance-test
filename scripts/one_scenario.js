import http from 'k6/http';
import { check, sleep } from 'k6';
import ws from 'k6/ws';

const HTTP_BASE_URL = 'http://sanha-api.shop:8080';
const WS_BASE_URL = 'ws://sanha-api.shop:8080';

let createMembers = "01077777700";
let joinMembers = "01077777701";
let defaultPassword = "1234";

export default function () {
    // Create member login
    let createLoginRes = http.post(`${HTTP_BASE_URL}/login`, JSON.stringify({
        identity: createMembers,
        password: defaultPassword
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    let createMemberAccessToken = createLoginRes.headers['Authorization'];
    check(createLoginRes, {
        'create member login status is 200': (r) => r.status === 200,
        'create member login response contains token': (r) => createMemberAccessToken !== undefined && createMemberAccessToken !== ''
    });

    // Join member login
    let joinLoginRes = http.post(`${HTTP_BASE_URL}/login`, JSON.stringify({
        identity: joinMembers,
        password: defaultPassword
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    let joinMemberAccessToken = joinLoginRes.headers['Authorization'];
    check(joinLoginRes, {
        'join member login status is 200': (r) => r.status === 200,
        'join member login response contains token': (r) => joinMemberAccessToken !== undefined && joinMemberAccessToken !== ''
    });

    // Create member room
    let createRoomRes = http.post(`${HTTP_BASE_URL}/rooms`, JSON.stringify({
        destinationLat: 37.555946,
        destinationLng: 126.972317,
        destinationName: "서울역",
        encounterDate: "2029-01-07 15:33"
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': createMemberAccessToken
        }
    });

    let roomCreateJson = JSON.parse(createRoomRes.body);
    let shareCode = roomCreateJson.shareCode;
    let roomSeq = roomCreateJson.roomSeq;

    check(createRoomRes, {
        'room create status is 200': (r) => r.status === 200,
        'room response contains shareCode': (r) => shareCode !== undefined && shareCode !== ''
    });

    // Join member room
    let joinRoomRes = http.post(`${HTTP_BASE_URL}/rooms/join`, JSON.stringify({
        shareCode: shareCode
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': joinMemberAccessToken
        }
    });

    check(joinRoomRes, {
        'room join status is 200': (r) => r.status === 200
    });

    const createWsOption = {
        headers: {
            "Authorization": createMemberAccessToken
        }
    };

    let startTime;
    let durationTime;

    const createRoomSocket = ws.connect(WS_BASE_URL + "/location/share", createWsOption, function (socket) {
        socket.on('open', function () {
            socket.send(JSON.stringify({
                "type": 0,
                "presentLat": 37.561949,
                "presentLng": 127.038485,
                "destinationDistance": 300
            }));
        });

        socket.on('close', function () {
            console.log('연결이 종료되었습니다.');
        });

        // socket.on('message', function (msg) {
        // console.log(`Received message: ${msg}`); // 메시지를 수신했을 때 로그 추가
        //     if (msg) {
        //         const response = JSON.parse(msg);
        //         if (response.roomSeq === roomSeq) {
        //             const endTime = Date.now();
        //             durationTime = endTime - startTime;
        //             console.log(`A가 메시지를 받는 데 걸린 시간: ${durationTime} ms`);
        //         }
        //     }
        // });

        
    });

    const joinWsOption = {
        headers: {
            "Authorization": joinMemberAccessToken
        }
    };

    const joinRoomSocket = ws.connect(WS_BASE_URL + "/location/share", joinWsOption, function (socket) {
        console.log("join member~!");
        socket.on('open', function () {
            startTime = Date.now();
            socket.send(JSON.stringify({
                "type": 1,
                "presentLat": 37.561949,
                "presentLng": 127.038485,
                "destinationDistance": 200
            }));
        });
    });

    // Room exit for both members
    let createMemberexitRoomRes = http.post(`${HTTP_BASE_URL}/rooms/exit`, JSON.stringify({
        roomSeq: roomSeq
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': createMemberAccessToken
        }
    });

    check(createMemberexitRoomRes, {
        'createMember room exit status is 200': (r) => r.status === 200
    });

    let joinMemberexitRoomRes = http.post(`${HTTP_BASE_URL}/rooms/exit`, JSON.stringify({
        roomSeq: roomSeq
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': joinMemberAccessToken
        }
    });

    check(joinMemberexitRoomRes, {
        'joinMember room exit status is 200': (r) => r.status === 200
    });
}
