import http from 'k6/http';
import { check, sleep } from 'k6';
import ws from 'k6/ws';

export const options = {
    vus: 1,
    duration: '5s'
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

    socketAll: function(url, token, message) {
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        };
        
        ws.connect(url, params, function(socket) {
            socket.on('open', function open() {
                socket.send(JSON.stringify(message));
                
                let lat = 37.566127;
                let lng = 127.042965;
                const stepSize = 0.02;
            
                for (let i = 0; i < 150; i++) {
                    
                    lat += stepSize;
                    lng += stepSize;
                
                    socket.send(JSON.stringify(room.makeSocketMessage(2, lat, lng, 200)));
                }
            });
    
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
    
    const accessToken_1 = auth.login("01012345678", "1234", HTTP_BASE_URL);
    
    const createMessage = room.makeSocketMessage(1, 37, 42, 300);
    
    room.socketAll(WS_BASE_URL, accessToken_1, createMessage);
}