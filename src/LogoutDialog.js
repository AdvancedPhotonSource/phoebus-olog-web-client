/**
 * Copyright (C) 2020 European Spallation Source ERIC.
 * <p>
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * <p>
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * <p>
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */

import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import './css/olog.css';
// Need axios for back-end access as the "fetch" API does not support CORS cookies.
import axios from 'axios';
import customization from './customization';

class LogoutDialog extends Component{

    state = {
        logoutError: ""
    };

    hideLogout = () => {
        this.setState({loginError: ""});
        this.props.setShowLogout(false);
    }

    logout = (event) => {
        event.preventDefault();

        axios.get(`${customization.urlRoot}/${process.env.REACT_APP_BASE_URL}/logout`, { withCredentials: true, baseURL: customization.urlRoot })
          .then(res => {
            this.setState({logoutError: ""});
            this.props.setUserData({userName: "", roles: []});
            this.hideLogout();
          }, error => { 
            if(!error.response){
              this.setState({loginError: "Logout failed. Service off-line?"})
            }
        });
    
        // Switch to axios?
        /*
        fetch(`${process.env.REACT_APP_BASE_URL}/Olog/logout`)
        .then(response => {
            this.setState({logoutError: ""});
            this.props.setUserData({userName: "", roles: []});
            this.hideLogout();
          })
        .catch(error => {
          this.setState({logoutError: "Logout failed. Service off-line?"});
        })
        */
    }

    render(){
        return(
        <Modal centered show={this.props.logoutDialogVisible} onHide={this.hideLogout}>
          <Modal.Header closeButton>
            <Modal.Title>Sign Out?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.logout}>
              <Form.Group></Form.Group>
              <Button variant="primary" type="submit">
                Yes
              </Button>
              <Button variant="secondary" onClick={this.hideLogout}>
                No
              </Button>
            </Form>
            <Form.Label className="failureStyle">{this.state.logoutError}</Form.Label>
          </Modal.Body>
        </Modal>
        )
    }
}

export default LogoutDialog;
