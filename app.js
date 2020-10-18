"use strict";

const apiKey = "pDTo9m0oGXSLF8dtss6DLSE8jqbft3wGupV6gwcD";
const searchURL = "https://api.nasa.gov";

function formatParams(params) {
    //may need more than 1 depending on how params need to be formated for each API
    const queryItems = Object.keys(params)
        .map(key => {
            return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        })
    return queryItems.join('&');
}

function getApod(today) {
    //get request for APOD API
    const params = {
        date: today,
        api_key: apiKey,
    }

    const queryString = formatParams(params)
    const url = searchURL + "/planetary/apod?" + queryString;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => displayResults(responseJson))
        .catch(err => {
            $('#js-error-message').text(`Something went wrong: ${err.message}`);
        });

}
//getApod(selectedDate);

function getNeoWs(today) {  
    const params = {
    end_date: today,
    api_key: apiKey,
}

const queryString = formatParams(params)
const url = searchURL + "/neo/rest/v1/feed?" + queryString;

fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => displayResults(responseJson))
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
    //get request for NeoWs API
}

function getInsight() {
    //get request for Insight API
}

function EarthToSOL() {
    //function may be needed to convert earth day to SOL day for Insight API
}

function displayResults(responseJson) {
    console.log(responseJson); 
    $("#aPOD-results").empty();
    $("#aPOD-results").append(`
                    <h3>${responseJson.title}<h3>
                    <img src=${responseJson.url} alt="Astronomy Picture of the Day)">`);
    $("#results").removeClass("hidden");                 
}

$("#date-picker").flatpickr({
    enableTime: false,
    dateFormat: "Y-m-d",
    defaultDate: "today",
    maxDate: "today",
    minDate: "2020-01-01"

}); 

function watchCalender() {
    $("#date-picker-js").click( function() {
        const selectedDate = $("#date-picker").val(); 
        getApod(selectedDate); 
        //getInsight(selectedDate);
        getNeoWs(selectedDate);
    });
    //function sets up for date selection on calender
}

function hideResults() {
    //a function that hides results based on user request 
}

$(watchCalender); 