# !/bin/bash

_url="https://mn23davtxw233udxyiavggqp6i0igjra.lambda-url.ap-northeast-2.on.aws/"

load_data(){
    for i in {0..10}; do
        curl $_url -X POST --data '{"sms":"'i'"}' -H "Content-Type: application/json" ;
        sleep 1 ;
    done
}

fetch_data(){
    curl $_url
}
