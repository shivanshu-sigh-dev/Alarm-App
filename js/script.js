// globals
const storage = window.localStorage;
let permissionGranted = false;

/**
 * @description This function is used to toggle an element visibility
 * @param {String} modalId the element ID
 * @param {String} mode visibility mode i.e. 'block' or 'none'
 */
const toggleModalVisibility = (modalId, mode) => {
    document.getElementById(modalId).style.display = mode;
};

/**
 * @description This function is used to register user to the app
 * @param {*} event event object to stop default action
 * @param {*} formObject the form object to get the form details
 */
const registerUser = (event, formObject) => {
    event.preventDefault();
    const userData = {
        firstName: formObject.querySelector("#firstName").value,
        lastName: formObject.querySelector("#lastName").value,
        password: CryptoJS.SHA512(formObject.querySelector("#password_reg").value).toString(),
        userAlarms: []
    };
    const userEmail = formObject.querySelector("#email_reg").value;
    if(storage.getItem(userEmail) == null){
        storage.setItem(userEmail, JSON.stringify(userData));
        let url = window.location.href;
        url = url.substring(0, url.lastIndexOf("/"));
        window.location.href = url + "/dashboard.html?username=" + userData.firstName + " " + userData.lastName + "&email=" + userEmail;
    } else {
        alert("User already registered. Please login.");
    }
};

/**
 * @description This function is used to login the user to the app
 * @param {*} event event object to stop default action
 * @param {*} formObject the form object to get the form details
 */
const loginUser = (event, formObject) => {
    event.preventDefault();
    const userEmail = formObject.querySelector("#email_log").value;
    if(storage.getItem(userEmail) == null){
        alert("User is not registered. Please register first.");
    } else {
        const userData = JSON.parse(storage.getItem(userEmail));
        const password = CryptoJS.SHA512(formObject.querySelector("#password_log").value).toString();
        if(password === userData.password){
            let url = window.location.href;
            url = url.substring(0, url.lastIndexOf("/"));
            window.location.href = url + "/dashboard.html?username=" + userData.firstName + " " + userData.lastName + "&email=" + userEmail;
        } else {
            alert("Incorrect Password");
        }
    }
};

/**
 * @description This function can be used to get date and time in the format of YYYY-MM-DD and HH:MM
 * @param {Date} now An object of Date
 * @returns {Object} An object with two properties containing the formatted date and time.
 */
const getDateAndTime = now => {
    let dd = now.getDate();
    let mm = now.getMonth() + 1;
    const yyyy = now.getFullYear();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if(dd < 10){
        dd = '0' + dd;
    }
    if(mm < 10){
        mm = '0' + mm;
    }
    return {
        d: yyyy + '-' + mm + '-' + dd,
        t: hours + ':' + minutes
    };
}

/**
 * @description This function is used to set min date and time
 * @param {*} now A date object
 * @param  {...any} args Element ID
 */
const setMinDateAndTime = (now, ...args) => {
    const dateTime = getDateAndTime(now);
    for(let x=0; x<args.length; x++){
        var element = document.getElementById(args[x]);
        if(element.getAttribute("type") === "date"){
            element.setAttribute("min", dateTime.d);
        } else if(element.getAttribute("type") === "time"){
            element.setAttribute("min", dateTime.t);
        }
    }
};

/**
 * @description This function used to set alarms using the browser Notification API
 * @param {*} dateTime The date and time for which alarm to be set
 */
const setAlarm = (dateTime) => {
    const now = new Date();
    const alarmDateTime = new Date(dateTime);
    // Get the time difference in seconds
    const finalAlarmTime = (alarmDateTime.getTime() - now.getTime()) / 1000;
    setTimeout(() => {
        alert("ALARM !!!!\nIf you have neet seen notification the this application has no HTTPS enabled.");
        const notification = new Notification("ALARM !!!!");
        setTimeout(() => {
            notification.close();
        }, 10000);
    }, finalAlarmTime * 1000);
};

/**
 * @description This function is used to logout the user from the app
 */
const logoutUser = () => {
    let url = window.location.href;
    url = url.substring(0, url.lastIndexOf("/"));
    window.location.href = url + "/index.html";
};

/**
 * @description This function is called while loading the app dashboard.
 */
const loadDashboard = () => {
    // Set min date and time for input type date and time
    setMinDateAndTime(new Date(), "alarmDate", "alarmTime");

    // Ask user permission to show notification
    if(Notification.permission === 'granted'){
        permissionGranted = true;
    } else if(Notification.permission !== 'denied'){
        Notification.requestPermission().then((permission) => {
            permissionGranted = permission === 'granted' ? true : false;
        }).catch((error) => {
            console.log(error);
        });
    }

    // Set user greeting
    const username = decodeURIComponent(window.location.href.split("?")[1].split("&")[0].split("=")[1]);
    document.getElementById("greeting").innerText = "Welcome, " + username;

    // show all alarms
    const userEmail = decodeURIComponent(window.location.href.split("?")[1].split("&")[1].split("=")[1]);
    const userData = JSON.parse(storage.getItem(userEmail));
    for(const list of userData.userAlarms){
        const newListItems = getNewListItems(list, userEmail);
        newListItems[0].appendChild(newListItems[1]);
        document.getElementById("all-alarms").appendChild(newListItems[0]);
    }
};

/**
 * @description This function is used to get a new list item
 * @param {*} dateTime Alarm date time to show in the new list item
 * @param {*} userEmail To get the user storage data
 * @returns An array containing new list item with new span
 */
const getNewListItems = (dateTime, userEmail) => {
    const newLi = document.createElement("li");
    newLi.innerHTML = dateTime;
    const newSpan = document.createElement("span");
    newSpan.className = "close";
    newSpan.style.color = "#000000";
    newSpan.onclick = function(){
        const userData = JSON.parse(storage.getItem(userEmail));
        const targetIndex = userData.userAlarms.indexOf(dateTime);
        userData.userAlarms.splice(targetIndex, 1);
        storage.setItem(userEmail, JSON.stringify(userData));
        newSpan.parentElement.remove();
    };
    newSpan.innerHTML = "&times;";
    return [newLi, newSpan];
};

/**
 * @description This function is used to create an new alarm.
 * @param {*} event event object to stop default action
 * @param {*} formObject the form object to get the form details
 */
const createAlarm = (event, formObject) => {
    event.preventDefault();
    const userEmail = decodeURIComponent(window.location.href.split("?")[1].split("&")[1].split("=")[1]);
    const userData = JSON.parse(storage.getItem(userEmail));
    const alarmDate = (formObject.querySelector("#alarmDate").value).split("-");
    const alarmTime = (formObject.querySelector("#alarmTime").value).split(":");;
    const alarmDateTime = new Date(alarmDate[0], (alarmDate[1] - 1), alarmDate[2], alarmTime[0], alarmTime[1]);
    const finalAlarmDateTime = alarmDateTime.toString().substring(0, alarmDateTime.toString().indexOf("GMT") - 1);
    if(userData.userAlarms.contains(finalAlarmDateTime)){
        alert("Alarm already added for the selected date and time.");
    } else {
        const newListItems = getNewListItems(finalAlarmDateTime, userEmail);
        newListItems[0].appendChild(newListItems[1]);
        document.getElementById("all-alarms").appendChild(newListItems[0]);
        userData.userAlarms.push(finalAlarmDateTime);
        storage.setItem(userEmail, JSON.stringify(userData));
        formObject.querySelector("#alarmDate").value = "";
        formObject.querySelector("#alarmTime").value = "";
        setAlarm(finalAlarmDateTime);
    }
};

/**
 * @description This function is used to update the user details
 * @param {*} event event object to stop default action
 * @param {*} formObject the form object to get the form details
 */
const updateUser = (event, formObject) => {
    event.preventDefault();
    const newEmail = formObject.querySelector("#email_reg").value;
    const userEmail = decodeURIComponent(window.location.href.split("?")[1].split("&")[1].split("=")[1]);
    const userData = JSON.parse(storage.getItem(userEmail));
    if(storage.getItem(newEmail) == null){
        userData.firstName = formObject.querySelector("#firstName").value;
        userData.lastName = formObject.querySelector("#lastName").value;
        userData.password = CryptoJS.SHA512(formObject.querySelector("#password_reg").value).toString();
        storage.setItem(newEmail, JSON.stringify(userData));
        storage.removeItem(userEmail);
        logoutUser();
        alert("User details updated successfully. Please login again with updated details.");
    } else {
        alert("Email already registered with us. Please use any new email to update.");
    }
};