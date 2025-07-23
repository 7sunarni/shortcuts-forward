# !/bin/bash

_url="$YOUR_URL"

load_data(){
    for i in {0..10}; do
        curl $_url -X POST --data '{"sms":"'i'"}' -H "Content-Type: application/json" ;
        sleep 1 ;
    done
}

fetch_data(){
    curl $_url
}
