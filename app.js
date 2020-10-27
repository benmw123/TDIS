"use strict";

const apiKey = "pDTo9m0oGXSLF8dtss6DLSE8jqbft3wGupV6gwcD";
const searchURL = "https://api.nasa.gov";

let store = {
    asteroidTracker: 0,
    neowsArray: "",
    currentAsteroid: "",
};

function formatParams(params) {
    //may need more than 1 depending on how params need to be formated for each API
    const queryItems = Object.keys(params)
        .map(key => {
            return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        })
    return queryItems.join('&');
}

function fetchAndCatch(url) {
    return fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
}

function getApod(selectedDate) {

    const params = {
        date: selectedDate,
        api_key: apiKey,
    }

    const queryString = formatParams(params)
    const url = searchURL + "/planetary/apod?" + queryString;

    return fetchAndCatch(url);
}

function getNeoWs(selectedDate) {
    const params = {
        start_date: selectedDate,
        end_date: selectedDate,
        api_key: apiKey,
    }

    const queryString = formatParams(params)
    const url = searchURL + "/neo/rest/v1/feed?" + queryString;

    return fetchAndCatch(url);
}

function getFetchRequests(selectedDate) {
    const apodFetch = getApod(selectedDate);
    const neowsFetch = getNeoWs(selectedDate);
    const marsPhotosFetch = getMarsPhotos(selectedDate);
    Promise.all([apodFetch, neowsFetch, marsPhotosFetch])
        .then(promiseAll => displayResults(promiseAll, selectedDate))
        .catch(err => {
            $("#aPOD-results").empty();
            $("#neoWs-results").empty();
            $("#mars-results").empty();
            $('#js-error-message').html(`Something went wrong. Try a different date.`);
        });
}

function getMarsPhotos(selectedDate) {
    //get request for Insight API
    const params = {
        earth_date: selectedDate,
        api_key: apiKey
    }

    const queryString = formatParams(params)
    const url = searchURL + "/mars-photos/api/v1/rovers/curiosity/photos?" + queryString;

    return fetchAndCatch(url);
}

function asteroidNavigator(selectedDate) {
    $("#next-button").click(function () {
        if (store.asteroidTracker < store.neowsArray.length - 1) {
            store.asteroidTracker += 1;
            neoWsHTMLgenerator(selectedDate);
        }
    });
    $("#previous-button").click(function () {
        if (store.asteroidTracker > 0) {
            store.asteroidTracker -= 1;
            neoWsHTMLgenerator(selectedDate);
        }
    });
}

function neoWsHTMLgenerator(selectedDate) {

    let options = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }
    //using .toLocaleString to add commas and round to two decimals. 
    let mphRounded = parseFloat(store.currentAsteroid.close_approach_data[0].relative_velocity.miles_per_hour).toLocaleString(undefined, options);
    let distanceRounded = parseFloat(store.currentAsteroid.close_approach_data[0].miss_distance.miles).toLocaleString(undefined, options);
    store.currentAsteroid = store.neowsArray[store.asteroidTracker];
    $("#neoWs-results").empty();
    $("#neoWs-results").append(`
                    <h3>Near Earth Object Alert!</h3>
                    <p>There are ${store.neowsArray.length} asteroids making their closest approach to Earth on ${selectedDate}.</p>
                    <p>The asteroid ${store.currentAsteroid.name.replace("(", '').replace(")", "")} is traveling 
                    at a relative speed of ${mphRounded} miles per hour,
                    and is approximately ${distanceRounded} miles from earth! </p>
                    <button id="previous-button">Previous</button>
                    <button id="next-button">Next</button>`);
    asteroidNavigator(selectedDate);
    hideResults();
}

function renderNeows(neowsData, selectedDate) {

    store.neowsArray = neowsData.near_earth_objects[selectedDate];
    store.currentAsteroid = store.neowsArray[store.asteroidTracker];
    neoWsHTMLgenerator(selectedDate);
}

function renderApod(apodData) {
    //determine if ApodData is a youtube video, or an image. 
    $("#aPOD-results").empty();
    if (apodData.url.includes("youtube")) {
        $("#aPOD-results").append(`
                    <h3>Astronomy Picture of The Day!</h3>
                    <p>${apodData.title}</p>
                    <iframe
                    src=${apodData.url} title="Astronomy Picture of the Day">
                    </iframe>`);
    } else {
        $("#aPOD-results").append(`
                    <h3>Astronomy Picture of The Day</h3>
                    <p>${apodData.title}</p>
                    <img class = "api-images" src=${apodData.url} alt="Astronomy Picture of the Day"></img><br />`);
    }
}

function renderMarsPhotos(marsPhotosData, selectedDate) {
    $("#mars-results").empty();
    $("#mars-results").append(`
                        <h3>Photos from Mars!</h3>
                        <p>The Mars rover took the below photo on ${selectedDate}</p>
                        <img class = "api-images" src= ${marsPhotosData.photos[0].img_src} alt="Mars Rover Photo"></img><br />`);
}


function displayResults([apodData, neowsData, marsPhotosData], selectedDate) {
    $("#results").removeClass("hidden");
    $('#js-error-message').empty();
    store.asteroidTracker = 0;
    renderApod(apodData, selectedDate);
    renderNeows(neowsData, selectedDate);
    renderMarsPhotos(marsPhotosData, selectedDate);
    hideResults();
}

function watchCalender() {

    $("#date-picker").flatpickr({
        enableTime: false,
        dateFormat: "Y-m-d",
        defaultDate: "today",
        maxDate: "today",
        minDate: "2020-01-01"

    });

    //.ready to generate data based on the current date by default. 
    $("#date-picker-js").ready(function () {
        const selectedDate = $("#date-picker").val();
        getFetchRequests(selectedDate);
    });

    //.click if user wants to change date. 
    $("#date-picker-js").click(function () {
        const selectedDate = $("#date-picker").val();
        getFetchRequests(selectedDate);
    });
}

function hideResults() {

    //the following events determines if checkboxes are checked on date selection, and changes class accordingly. 
    $("#date-picker-js").click(function () {
        if ($("#apod-checkbox").is(':checked')) {
            $("#aPOD-results").addClass("hidden");
        }
    });

    $("#date-picker-js").click(function () {
        if ($("#neows-checkbox").is(':checked')) {
            $("#neoWs-results").addClass("hidden");
        }
    });

    $("#date-picker-js").click(function () {
        if ($("#marsPhotos-checkbox").is(':checked')) {
            $("#mars-results").addClass("hidden");
        }
    });

    //the following events change the div class to hidden depending on checkbox value. 
    $("#apod-checkbox").change(function () {
        if (this.checked) {
            $("#aPOD-results").addClass("hidden");
        } else {
            $("#aPOD-results").removeClass("hidden");
        }
    });

    $("#neows-checkbox").change(function () {
        if (this.checked) {
            $("#neoWs-results").addClass("hidden");
        } else {
            $("#neoWs-results").removeClass("hidden");
        }
    });

    $("#marsPhotos-checkbox").change(function () {
        if (this.checked) {
            $("#mars-results").addClass("hidden");
        } else {
            $("#mars-results").removeClass("hidden");
        }
    });
}

$(watchCalender); 
