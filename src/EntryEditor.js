/**
 * Copyright (C) 2019 European Spallation Source ERIC.
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
import React, {Component} from 'react';
import Container from 'react-bootstrap/esm/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import Selection from './Selection';
import Button from 'react-bootstrap/Button';
import {FaPlus} from 'react-icons/fa';
import FormFile from 'react-bootstrap/FormFile';
import Attachment from './Attachment.js'
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import checkSession from './session-check';
//import PropertyEditor from './PropertyEditor';
//import Modal from 'react-bootstrap/Modal';
import customization from './customization';
import EmbedImageDialog from './EmbedImageDialog';
import { v4 as uuidv4 } from 'uuid';
import OlogAttachment from './OlogAttachment';
import {getLogEntryGroup, removeImageMarkup, newLogEntryGroup} from './utils';


class EntryEditor extends Component{

    state = {
        selectedLogbooks: [],
        selectedTags: [],
        level: "",
        attachedFiles: [],
        validated: false,
        logbookSelectionValid: true,
        levelSelectionValid: true,
        properties: [],
        showAddProperty: false,
        showEmbedImageDialog: false,
        logEntryGroupProperty: null
    }

    propertyNameRef = React.createRef();
    fileInputRef = React.createRef();
    titleRef = React.createRef();
    descriptionRef = React.createRef();

    componentDidMount = () => {
        // If currentLogRecord is defined, use it as a "template", i.e. user is replying to a log entry.
        // Copy relevant fields to the state of this class, taking into account that a Log Entry Group
        // may or may not exist in the template.
        if(this.props.currentLogRecord){
            let p = [];
            this.props.currentLogRecord.properties.forEach((property, i) => {
                p.push(property);
            });
            if(!getLogEntryGroup(this.props.currentLogRecord.properties)){
                let property = newLogEntryGroup();
                this.setState({logEntryGroupPoroperty: property});
                p.push(property);
            }
            this.setState({
                selectedLogbooks: this.props.currentLogRecord.logbooks,
                selectedTags: this.props.currentLogRecord.tags,
                level: this.props.currentLogRecord.level,
                properties: p
            });
            this.titleRef.current.value = this.props.currentLogRecord.title;
        }
        else {
            //Create default template for log entry description
            this.descriptionRef.current.value = "# System: \n\n# Problem Description\n\n# Observation\n\n# Action Taken/Requested\n\n# Required Followup\n\n";
        }
    }
    
    addLogbook = (logbook) => {
        var present = false;
        this.state.selectedLogbooks.map(element => {
            if(element.name === logbook.name){
                present = true;
                return null;
            }
            return null;
        });
        if(!present){
            this.setState({selectedLogbooks: [...this.state.selectedLogbooks, logbook]},
                () => this.setState({logbookSelectionValid: this.state.selectedLogbooks.length > 0}));
        }
    }

    removeLogbook = (logbook) => {
        this.setState({
                selectedLogbooks: this.state.selectedLogbooks.filter(item => item.name !== logbook.name)},
                () => this.setState({logbookSelectionValid: this.state.selectedLogbooks.length > 0})
        );
    }

    addTag = (tag) => {
        var present = false;
        this.state.selectedTags.map(element => {
            if(element.name === tag.name){
                present = true;
            }
            return null;
        });
        if(!present){
            this.setState({selectedTags: [...this.state.selectedTags, tag]});
        }
    }

    removeTag = (tag) => {
        this.setState({
                selectedTags: this.state.selectedTags.filter(item => item.name !== tag.name)
        });
    }

    onBrowse = () => {
        this.fileInputRef.current.click();
    }
    
    onFileChanged = (event) => {
        if(event.target.files){
            let a = [];
            for(var i = 0; i < event.target.files.length; i++){
                a[i] = new OlogAttachment(event.target.files[i], uuidv4());
            }
            this.setState({attachedFiles: [...this.state.attachedFiles, ...a]});
        }
        this.fileInputRef.current.value = null;
    }

    /**
     * Removes attachment and - where applicable - updates the body/description.
     * @param {*} file 
     */
    removeAttachment = (file) => {
        this.setState({attachedFiles: this.state.attachedFiles.filter(item => item.file !== file.file)});
        if(this.descriptionRef.current.value.indexOf(file.id) > -1){  // Find potential markup referencing the attachment
            let updatedDescription = removeImageMarkup(this.descriptionRef.current.value, file.id);
            this.descriptionRef.current.value = updatedDescription;
        }
    }

    /**
     * Uploading multiple attachments must be done in a synchronous manner. Using axios.all()
     * will upload only a single attachment, not sure why...
     * @param {*} id 
     * @returns 
     */
    submitAttachmentsMulti = async (id) => {
        for (var i = 0; i < this.state.attachedFiles.length; i++) {
            let formData = new FormData();
            formData.append('file', this.state.attachedFiles[i].file);
            formData.append('id', this.state.attachedFiles[i].id);
            formData.append('filename', this.state.attachedFiles[i].file.name);
            await axios.post(`${process.env.REACT_APP_BASE_URL}/logs/attachments/` + id, 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json'
                    },
                    withCredentials: true
                });
        }
    }

    updateCurrentLogRecord = () => {
        const logEntry = {
            id: this.props.currentLogRecord.id,
            logbooks: this.props.currentLogRecord.logbooks,
            tags: this.props.currentLogRecord.logbooks.tags,
            properties: this.state.properties,
            title: this.props.currentLogRecord.title,
            level: this.props.currentLogRecord.level,
            description: this.props.currentLogRecord.source,
            source: null
        };
        axios.post(`${process.env.REACT_APP_BASE_URL}/logs/` + this.props.currentLogRecord.id + `?markup=commonmark`, logEntry, { withCredentials: true })
        .catch(error => {
            if(error.response && (error.response.status === 401 || error.response.status === 403)){
                alert('You are currently not authorized to create a log entry.')
            }
            else if(error.response && (error.response.status >= 500)){
                alert('Failed to create log entry.')
            }
        });
    }

    selectionsValid = () => {
        this.setState({logbookSelectionValid: this.state.selectedLogbooks.length > 0,
            levelSelectionValid: this.state.level !== ""});
        return this.state.logbookSelectionValid
            && this.state.levelSelectionValid;
    }


    submit = (event) => {
        event.preventDefault();

        var promise = checkSession();
        if(!promise){
            this.props.setShowLogin(true);
            return;
        }
        else{
            promise.then(data => {
                if(!data){
                    this.props.setShowLogin(true);
                    return;
                }
            });
        }

        const selectionsAreValid = this.selectionsValid();
        const form = event.currentTarget;        
        this.setState({validated: true});

        if (form.checkValidity() === true && selectionsAreValid){
            const { history } = this.props;
            const logEntry = {
                logbooks: this.state.selectedLogbooks,
                tags: this.state.selectedTags,
                properties: this.state.properties,
                title: this.titleRef.current.value,
                level: this.state.level,
                description: this.descriptionRef.current.value
            }
            axios.put(`${process.env.REACT_APP_BASE_URL}/logs?markup=commonmark`, logEntry, { withCredentials: true })
                .then(res => {
                    if(this.state.attachedFiles.length > 0){ // No need to call backend if there are no attachments.
                        this.submitAttachmentsMulti(res.data.id);
                    }
                    // If the currentLogRecord is defined then user is creating a reply entry. So we need to update the currentLogRecord 
                    // with the Log Entry Group, but only if the currentLogRecord does not yet contain it.
                    if(this.props.currentLogRecord && !getLogEntryGroup(this.props.currentLogRecord.properties)){    
                        this.updateCurrentLogRecord();
                    }
                    history.push('/');
                })
                .catch(error => {
                    if(error.response && (error.response.status === 401 || error.response.status === 403)){
                        alert('You are currently not authorized to create a log entry.')
                    }
                    else if(error.response && (error.response.status >= 500)){
                        alert('Failed to create log entry.')
                    }
                });
            
        }
    }

    selectLevel = (level) => {
        this.setState({level: level}, () => this.setState({levelSelectionValid: level !== ""}));
    }

    addProperty = () => {
        const properties = {...this.state.properties};
        properties[this.propertyNameRef.current.value] = {};
        this.setState({showAddProperty: false, properties});
    }

    setShowEmbeddImageDialog = (show) => {
        this.setState({showEmbedImageDialog: show});
    }

    removeProperty = (key) => {
        const properties = {...this.state.properties};
        delete properties[key];
        this.setState({properties});
    }

    addKeyValuePair = (propertyName, key, value) => {
        const copy = this.state.properties[propertyName];
        copy[key] = value;
        const properties = {...this.state.properties};
        properties[propertyName] = copy;
        this.setState({properties: properties});
    }

    removeKeyValuePair = (propertyName, key) => {
        const copy = this.state.properties[propertyName];
        delete copy[key];
        const properties = {...this.state.properties};
        properties[propertyName] = copy;
        this.setState({properties: properties});
    }

    addEmbeddedImage = (file, width, height) => {
        this.setState({showEmbedImageDialog: false});
        const id = uuidv4();
        var imageMarkup = "![](attachment/" + id + "){width=" + width + " height=" + height + "}";
        this.descriptionRef.current.value += imageMarkup;
        const ologAttachment = new OlogAttachment(file, id);
        this.setState({attachedFiles: [...this.state.attachedFiles, ologAttachment]});
    }

    render(){

        var logbookItems = this.props.logbooks.sort((a, b) => a.name.localeCompare(b.name)).map((row, index) => {
            return (
                <Dropdown.Item key={index}  
                    style={{fontSize: "12px", paddingBottom: "1px"}}
                    eventKey={index} 
                    onSelect={() => this.addLogbook(row)}>{row.name}</Dropdown.Item>
            )
        });

        var tagItems = this.props.tags.sort((a, b) => a.name.localeCompare(b.name)).map((row, index) => {
            return (
                <Dropdown.Item key={index} 
                    style={{fontSize: "12px", paddingBottom: "1px"}}
                    eventKey={index}
                    onSelect={() => this.addTag(row)}>{row.name}</Dropdown.Item>
            )
        });

        var currentLogbookSelection = this.state.selectedLogbooks.map((row, index) => {
            return(
                <Selection item={row} key={index} delete={this.removeLogbook}/>
            )
        });

        var currentTagSelection = this.state.selectedTags.map((row, index) => {
            return(
                <Selection item={row} key={index} delete={this.removeTag}/>
            )
        });

        var attachments = this.state.attachedFiles.map((file, index) => {
            return(
                <Attachment key={index} file={file} removeAttachment={this.removeAttachment}/>
            )
        })

        let levels = customization.levelValues.split(",");

        const doUpload = this.props.fileName !== '';

        /*
        var editorRows = Object.keys(this.state.properties).map(key => {
            return (
                <PropertyEditor key={key}
                    name={key}
                    addKeyValuePair={this.addKeyValuePair}
                    removeKeyValuePair={this.removeKeyValuePair}
                    removeProperty={this.removeProperty}/>
            )
        })
        */

        return(
            <>
                <Container fluid className="full-height">
                    <Form noValidate validated={this.state.validated} onSubmit={this.submit}>
                        <Form.Row>
                            <Form.Label className="new-entry">New Log Entry</Form.Label>
                            <Button type="submit" disabled={this.props.userData.userName === ""}>Create</Button>
                        </Form.Row>
                        <Form.Row className="grid-item">
                            <Dropdown as={ButtonGroup}>
                                <Dropdown.Toggle className="selection-dropdown" size="sm" variant="secondary">
                                    Logbooks
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {logbookItems}
                                </Dropdown.Menu>
                            </Dropdown>
                            &nbsp;{currentLogbookSelection}
                            {!this.state.logbookSelectionValid && 
                                <Form.Label className="form-error-label" column={true}>Select at least one logbook.</Form.Label>}
                        </Form.Row>
                        <Form.Row className="grid-item">
                            <Dropdown as={ButtonGroup}>
                                <Dropdown.Toggle className="selection-dropdown" size="sm" variant="secondary">
                                    Tags
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {tagItems}
                                </Dropdown.Menu>
                            </Dropdown>
                            &nbsp;{currentTagSelection}
                        </Form.Row>
                        <Form.Row className="grid-item">
                            <Dropdown as={ButtonGroup}>
                                <Dropdown.Toggle className="selection-dropdown" size="sm" variant="secondary">
                                    {customization.level}                                
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                {levels.map((level, index) => (
                                    <Dropdown.Item eventKey={index}
                                    style={{fontSize: "12px", paddingBottom: "1px"}}
                                    key={index}
                                    onSelect={() => this.selectLevel(level)}>{level}</Dropdown.Item>
                                ))}
                                </Dropdown.Menu>
                            </Dropdown>&nbsp;
                            {this.state.level && <div className="selection">{this.state.level}</div>}
                            {this.state.levelSelectionValid ? null : <Form.Label className="form-error-label" column={true}>Select a level.</Form.Label>}
                        </Form.Row>
                        <Form.Row className="grid-item">
                            <Form.Control 
                                required
                                type="text" 
                                placeholder="Title" 
                                ref={this.titleRef}/>
                            <Form.Control.Feedback type="invalid">
                                Please specify a title.
                            </Form.Control.Feedback>
                        </Form.Row>
                        <Form.Row className="grid-item">
                            <Form.Control
                                as="textarea" 
                                rows="9"
                                placeholder="Comments"
                                ref={this.descriptionRef}/>
                        </Form.Row>
                        <Form.Row>
                            <Button variant="secondary" size="sm"
                                    onClick={ doUpload && this.props.onUploadStarted ? this.props.onUploadStarted : this.onBrowse }>
                                <span><FaPlus className="add-button"/></span>Add Attachments
                            </Button>
                            <FormFile.Input
                                    hidden
                                    multiple
                                    ref={ this.fileInputRef }
                                    onChange={ this.onFileChanged } />
                            <Button variant="secondary" size="sm" style={{marginLeft: "5px"}}
                                    onClick={() => this.setState({showEmbedImageDialog: true})}>
                                Embed Image
                            </Button>
                        </Form.Row>
                        </Form>
                        {this.state.attachedFiles.length > 0 ? <Form.Row className="grid-item">{attachments}</Form.Row> : null}
                        {/*<Form.Row className="grid-item">
                            <Form.Group>
                                <Button variant="secondary" size="sm" onClick={() => this.setState({showAddProperty: true})}>
                                    <span><FaPlus className="add-button"/></span>Add Property
                                </Button>
                                {editorRows}              
                            </Form.Group>
                                </Form.Row>*/}
                </Container>
                {/*
                <Modal show={this.state.showAddProperty} onHide={() => this.setState({showAddProperty: false})}>
                    <Modal.Header closeButton>
                        <Modal.Title>New Property</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Control type="text" placeholder={'Property name'} ref={this.propertyNameRef} /> 
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={this.addProperty}>Add</Button>
                        <Button variant="secondary" onClick={() => this.setState({showAddProperty: false})}>Cancel</Button>
                    </Modal.Footer>
                </Modal>
                */}
                <EmbedImageDialog showEmbedImageDialog={this.state.showEmbedImageDialog} 
                    setShowEmbedImageDialog={this.setShowEmbeddImageDialog}
                    addEmbeddedImage={this.addEmbeddedImage}/>
            </>
        )
    }
}

export default withRouter(EntryEditor);
