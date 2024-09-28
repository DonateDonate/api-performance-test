import http from 'k6/http';
import { check, sleep } from 'k6';
import ws from 'k6/ws';

export const options = {
    vus: 1,
    duration: '1s'
};

const HTTP_BASE_URL = 'http://sanha-api.shop:8080';
const WS_BASE_URL = 'ws://sanha-api.shop:8080/location/share';

const auth = {
    login: function(id, pwd, baseUrl) {
        let createLoginRes = http.post(`${baseUrl}/login`, JSON.stringify({
            identity: id,
            password: pwd
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

        let accessToken = createLoginRes.headers['Authorization'];
        return accessToken;
    }
};

const room = {
    create: function(lat, lng, destinationName, encounterDate, token) {
        let createRoomRes = http.post(`${HTTP_BASE_URL}/rooms`, JSON.stringify({
            destinationLat: lat,
            destinationLng: lng,
            destinationName: destinationName,
            encounterDate: encounterDate
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        let roomCreateJson = JSON.parse(createRoomRes.body);
        return { "shareCode": roomCreateJson.shareCode, "roomSeq": roomCreateJson.roomSeq };
    },
    
    socketConnect: function(url, token) {
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        };
        ws.connect(url, params, function(socket) {
            socket.on('open', () => console.log('connected'));
        });
    },

    socketAll: function(url, token, message,) {
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        };
        ws.connect(url, params, function(socket) {
            socket.on('open', function open() {
                socket.send(JSON.stringify(message));

                let lat = 37.2073460596323;
                let lng = 127.453777119874;
                const stepSize = 0.01;
                for(let i = 0; i<200; i++){
                    lat = lat + stepSize;
                    lng = lng + stepSize;
                    socket.send(JSON.stringify(room.makeSocketMessage(2,lat,lng,200)))   
                }
          
                // socket.setInterval(function timeout() {
                //     let lat = 37.5681501121823;
                //     let lng = 126.9893055655;
                //     const stepSize = 0.0001;
                //     for(let i = 0; i<200; i++){
                //         lat = lat + stepSize;
                //         lng = lng + stepSize;
                //         socket.send(JSON.stringify(room.makeSocketMessage(2,lat,lng,200)))   
                //     }
                // }, 1000);
              });
            socket.on('message', (data) => console.log('Message received: ', data));
            socket.on('close', () => console.log('disconnected'));
        });
    },
    
    makeSocketMessage: function(type, lat, lng, distance) {
        return {
            "type": type,
            "presentLat": lat,
            "presentLng": lng,
            "destinationDistance": distance
        };
    },

    makeDistanceChangeMessage : function(){
        for(let i = 0; i<100; i++){

        }
    }
};

export default function () {
    console.log('Function executed');
    
    // Uncomment these lines if needed
     const accessToken_1 = auth.login("01012345678", "1234", HTTP_BASE_URL);
     //const accessToken_2 = auth.login("01075699952", "1234", HTTP_BASE_URL);
    //const createRes = room.create(37, 42, "room_k6_1", "2024-09-27 18:00", accessToken);
    // console.log(createRes.shareCode);
    // console.log(createRes.roomSeq);

    const createMessage = room.makeSocketMessage(0, 37, 42, 300);
    //const joinMessage = room.makeSocketMessage(1, 37, 42, 300);
 
    room.socketAll(WS_BASE_URL, accessToken_1, createMessage);
    //room.socketConnect(WS_BASE_URL, accessToken_2);

}