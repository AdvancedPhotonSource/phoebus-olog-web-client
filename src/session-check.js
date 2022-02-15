import axios from 'axios';
import customization from './customization';

function checkSession () {
    // Try to get user data from back-end.
    // If server returns user data with non-null userName, there is a valid session.
    return axios.get(`${customization.urlRoot}/${process.env.REACT_APP_BASE_URL}/user`, { withCredentials: true, baseURL: customization.urlRoot })
            .then(res => {return res.data})
            .catch(err => alert("Unable to check login session: " + err));
}

export default checkSession;
