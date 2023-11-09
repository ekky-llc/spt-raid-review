#!/bin/bash

map_array=("customsb.jpg" "customsb.jpg" "fact0-1211b2.jpg" "factg-1211b.jpg" "fact1c-1211b.jpg" "fact2c-1211b.jpg" "interchangelg0b.jpg" "interchange1.jpg" "interchange2b.jpg" "lab0rb.jpg" "lab1rb.jpg" "lab2rb.jpg" "lighthouse2b.jpg" "reservet0a.jpg" "reservet1.jpg" "shoreline.jpg" "woodsg.jpg");

for map in ${map_array[@]}; do
    curl "https://kronzky.info/eft/$map" --output "$map.jpg"
done