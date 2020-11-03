"use strict";

const apiKey = "pDTo9m0oGXSLF8dtss6DLSE8jqbft3wGupV6gwcD";
const searchURL = "https://api.nasa.gov";

let store = {
    asteroidTracker: 0,
    neowsArray: "",
    currentAsteroid: "",
};

/********** FETCH FUNCTIONS **********/
//the following functions handle my fetch requests and format my parameters 

function formatParams(params) {
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
        .catch(err => {
            console.log(err);
        });
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

function getMarsPhotos(selectedDate) {
    const params = {
        earth_date: selectedDate,
        api_key: apiKey
    }

    const queryString = formatParams(params)
    const url = searchURL + "/mars-photos/api/v1/rovers/curiosity/photos?" + queryString;

    return fetchAndCatch(url);
}

function getFetchRequests(selectedDate) {
    const apodFetch = getApod(selectedDate);
    const neowsFetch = getNeoWs(selectedDate);
    const marsPhotosFetch = getMarsPhotos(selectedDate);
    Promise.all([apodFetch, neowsFetch, marsPhotosFetch])
        .then(promiseAll => displayResults(promiseAll, selectedDate))
}

/********** RENDER FUNCTIONS **********/
//the following functions render content and generate templates

function displayResults([apodData, neowsData, marsPhotosData], selectedDate) {

    $("#results").removeClass("hidden");
    $(".checkbox").removeClass("hidden");
    store.asteroidTracker = 0;
    renderApod(apodData, selectedDate);
    renderNeows(neowsData, selectedDate);
    renderMarsPhotos(marsPhotosData, selectedDate);
    hideResults();
}

function renderNeows(neowsData, selectedDate) {

    store.neowsArray = neowsData.near_earth_objects[selectedDate];

    //if no data is found for the API the if condition will be triggered. 
    if (store.neowsArray === undefined) {
        $("#neows-results").empty();
        $("#neows-results").append(`
                    <h3>Near Earth Object Alert!</h3>
                    <p>No data is available for selected date.<p>`)
    } else {
        store.currentAsteroid = store.neowsArray[store.asteroidTracker]
        neoWsHTMLgenerator(selectedDate);
    }
}

function neoWsHTMLgenerator(selectedDate) {

    let options = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }
    //using .toLocaleString to add commas and round to two decimals. 
    store.currentAsteroid = store.neowsArray[store.asteroidTracker];
    let mphRounded = parseFloat(store.currentAsteroid.close_approach_data[0].relative_velocity.miles_per_hour).toLocaleString(undefined, options);
    let distanceRounded = parseFloat(store.currentAsteroid.close_approach_data[0].miss_distance.miles).toLocaleString(undefined, options);
    $("#neows-results").empty();
    $("#neows-results").append(`
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

function renderApod(apodData) {

    //if no data is found the first if statement will be triggered.
    $("#aPOD-results").empty();
    if (apodData === undefined) {
        $("#aPOD-results").append(`
                    <h3>Astronomy Picture of The Day!</h3>
                    <p>No data is available for selected date.<p>`)
    } else {
        //determine if ApodData is a video or an image.
        if (apodData.media_type === "video") {
            $("#aPOD-results").append(`
                    <h3>Astronomy Picture of The Day!</h3>
                    <p>${apodData.title}</p>
                    <iframe src=${apodData.url} title="Astronomy Picture of the Day">
                    </iframe>`);
        } else {
            $("#aPOD-results").append(`
                    <h3>Astronomy Picture of The Day</h3>
                    <p>${apodData.title}</p>
                    <img class = "api-images" src=${apodData.url} alt="Astronomy Picture of the Day"></img><br />`);
        }
    }
}

function renderMarsPhotos(marsPhotosData, selectedDate) {

    $("#mars-results").empty();
    //if no data is found for the API the if condition will be triggered. 
    if (marsPhotosData.photos[0] === undefined) {
        $("#mars-results").append(`
        <h3>Photos from Mars!</h3>
        <p>No data is available for selected date.<p>`)
    } else {
        $("#mars-results").append(`
                        <h3>Photos from Mars!</h3>
                        <p>The Mars rover took the below photo on ${selectedDate}.</p>
                        <img class = "api-images" src= ${marsPhotosData.photos[0].img_src} alt="Mars Rover Photo"></img><br />`);
    }
}

/********** EVENT HANDLERS **********/
//the following functions handle events

function asteroidNavigator(selectedDate) {
    $("#next-button").click(function () {
        if (store.asteroidTracker < store.neowsArray.length - 1) {
            store.asteroidTracker += 1;
            console.log(store.asteroidTracker);
            neoWsHTMLgenerator(selectedDate);
        }
    });
    $("#previous-button").click(function () {
        if (store.asteroidTracker > 0) {
            store.asteroidTracker -= 1;
            console.log(store.asteroidTracker);
            neoWsHTMLgenerator(selectedDate);
        }
    });
}

function hideDiv(checkbox, results) {

    $("#date-picker-js").click(function () {
        if ($(checkbox).is(':checked')) {
            $(results).addClass("hidden");
        }
    });

    $(checkbox).change(function () {
        if (this.checked) {
            $(results).addClass("hidden");
        } else {
            $(results).removeClass("hidden");
        }
    });
}

function hideResults() {

    hideDiv("#apod-checkbox", "#aPOD-results");
    hideDiv("#neows-checkbox", "#neows-results");
    hideDiv("#marsPhotos-checkbox", "#mars-results");
}

function watchCalender() {

    $("#date-picker").flatpickr({
        enableTime: false,
        allowInput: true,
        dateFormat: "Y-m-d",
        defaultDate: "today",
        maxDate: "today",
        minDate: "1899-12-31",
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

$(watchCalender); 