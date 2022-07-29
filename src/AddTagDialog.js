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
import checkSession from './session-check';

// Need axios for back-end access as the "fetch" API does not support CORS cookies.
import axios from 'axios'

class AddTagDialog extends Component{

    state = {
        name: ""
    }

    nameRef = React.createRef();

    createTag = () => {
        var name = this.nameRef.current.value;
        // TODO add error handling if request fails.
        var promise = checkSession();
        if(!promise){
            this.props.setUserData({});
            return;
        }
        else{
            promise.then(data => {
                if(!data){
                    this.props.setUserData({});
                    return;
                }
                else {
                    axios.put(`${process.env.REACT_APP_BASE_URL}/tags/` + name, {name: name, state: "Active"}, { withCredentials: true })
                    .then(res => {
                        this.props.setShowAddTag(false);
                        this.props.refreshTags();
                    }).catch(error => {
                        if(error.response && (error.response.status === 401 || error.response.status === 403)){
                            alert('You are currently not logged in.')
                        }
                        else if(error.response && (error.response.status >= 500)){
                            alert('Failed to create log entry.')
                        }
                        this.props.setShowAddTag(false);
                    });
                }
            });
        }
    }
    
    render(){
        return(
            <Modal show={this.props.addTagDialogVisible} 
                onHide={() => this.props.setShowAddTag(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>New Tag</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Control type="text" placeholder={'Tag name'} ref={this.nameRef} /> 
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.createTag}>Create</Button>
                    <Button variant="secondary" onClick={() => this.props.setShowAddTag(false)}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

export default AddTagDialog;
