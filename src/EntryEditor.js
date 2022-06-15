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
import axios from 'axios';
import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Container from 'react-bootstrap/esm/Container';
import Form from 'react-bootstrap/Form';
import FormFile from 'react-bootstrap/FormFile';
import Modal from 'react-bootstrap/Modal';
import { FaPlus } from 'react-icons/fa';
import { withRouter } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Attachment from './Attachment.js';
import customization from './customization';
import EmbedImageDialog from './EmbedImageDialog';
import OlogAttachment from './OlogAttachment';
import PropertyEditor from './PropertyEditor';
import PropertySelector from './PropertySelector';
import Selection from './Selection';
import checkSession from './session-check';
import { getLogEntryGroupId, newLogEntryGroup, removeImageMarkup, ologClientInfoHeader } from './utils';
import HtmlPreview from './HtmlPreview';
import LogHistory from './LogHistory';
import LoadingOverlay from 'react-loading-overlay';

class EntryEditor extends Component{

    state = {
        selectedLogbooks: [],
        selectedTags: [],
        level: customization.defaultLevel,
        attachedFiles: [],
        validated: false,
        selectedProperties: [],
        showAddProperty: false,
        showEmbedImageDialog: false,
        logEntryGroupProperty: null,
        availableProperties: [],
        showHtmlPreview: false,
        createInProgress: false,
        currentLogEntry: null,
        replyAction: true,
        showError: false,
        cursorSelStart: null,
        cursorSelEnd: null,
        currentClipboardImageObj: null
    }

    fileInputRef = React.createRef();
    titleRef = React.createRef();
    descriptionRef = React.createRef();

    componentDidMount = () => {
        document.addEventListener("keydown", this.addTimestamp, false);
        var id = 0;
        if (this.props.match.params.id !== undefined || this.props.match.params.id !== "") {
            id = this.props.match.params.id;
        }
        this.loadLogEntry(id);
        // If currentLogEntry is defined, use it as a "template", i.e. user is replying to a log entry.
        // Copy relevant fields to the state of this class, taking into account that a Reply
        // may or may not exist in the template.
        //var currentLogEntry = this.props.getCurrentLogEntry();
        //this.setState({logEntry: currentLogEntry});
        //var replyAction = this.props.getReplyAction();
        if(id > 0 ){
            this.props.setReplyAction(true);
/*            let p = [];
            currentLogEntry.properties.forEach((property, i) => {
                p.push(property);
            });
            if(!getLogEntryGroupId(currentLogEntry.properties)){
                let property = newLogEntryGroup();
                p.push(property);
            }
            this.setState({
                selectedLogbooks: currentLogEntry.logbooks,
                selectedTags: currentLogEntry.tags,
                level: customization.defaultLevel,
                selectedProperties: p
            });
            this.titleRef.current.value = this.state.currentLogEntry.title;
*/        } else {
            //If user is not replying to a log entry, create default template for log entry description
            this.descriptionRef.current.value = "# System: \n\n# Problem Description\n\n# Observation\n\n# Action Taken/Requested\n\n# Required Followup\n\n";
        }
        this.getAvailableProperties();
    }

    componentWillUnmount(){
        document.removeEventListener("keydown", this.addTimestamp, false);
    }

    loadLogEntry = (id) => {
        if(id < 1){
            this.setState({replyAction: false});
            this.props.setReplyAction(false);
            return;
        }
        fetch(`${process.env.REACT_APP_BASE_URL}/logs/` + id)
        .then(response => {
            if(response.ok){
                return response.json();
            }
            else{
                throw Error("Server returned error.");
            }
        })
        .then(data => {
          if(data){
              this.setState({currentLogEntry: data});
              this.setState({replyAction: true});
              this.props.setReplyAction(true);
              this.props.setCurrentLogEntry(data);
            let p = [];
            data.properties.forEach((property, i) => {
                p.push(property);
            });
            this.setState({
                selectedLogbooks: data.logbooks,
                selectedTags: data.tags,
                level: customization.defaultLevel,
                selectedProperties: p
            });
            this.titleRef.current.value = data.title;
          }
        })
        .catch(() => {
            this.setState({currentLogEntry : null});
            this.setState({showError : true});
        });
    }

    addTimestamp = (e) => {
      if (e.altKey && e.code === 'KeyT') {
        var timestampMarkup = new Date().toLocaleString() + "";
        if (isNaN(this.descriptionRef.current.selectionStart) || isNaN(this.descriptionRef.current.selectionEnd)) {
            this.descriptionRef.current.value += timestampMarkup;
        } else {
            var logString = this.descriptionRef.current.value;
            var cursorLocation = this.descriptionRef.current.selectionStart + timestampMarkup.length;
            this.descriptionRef.current.value = logString.substring(0, this.descriptionRef.current.selectionStart) + timestampMarkup + logString.substring(this.descriptionRef.current.selectionEnd, logString.length);
            this.descriptionRef.current.selectionStart = this.descriptionRef.current.selectionEnd = cursorLocation;
        }
      }
    }

    getCurrentLogEntry = () => {
        return this.state.currentLogEntry;
    }

    getReplyAction = () => {
        return this.state.replyAction;
    }


    componentDidUpdate = (nextProps, nextState) => {
        // The below will ensure that when user has selected Reply and then New Log Entry,
        // the entry being edited does not contain any copied data.
        if(nextState.replyAction !== this.state.replyAction){
            this.setState({selectedLogbooks: [], 
                selectedTags: [], 
                level: customization.defaultLevel, 
                selectedProperties: []});
            this.titleRef.current.value = "";
        }
    }

    getAvailableProperties = () => {
        fetch(`${process.env.REACT_APP_BASE_URL}/properties`)
        .then(response => response.json())
        .then(data => this.setState({availableProperties: data}))
        .catch(() => this.setState({availableProperties: []}));
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
                    withCredentials: true,
                    baseURL: customization.urlRoot
                });
        }
    }

    selectionsValid = () => {
        this.setState({logbookSelectionValid: this.state.selectedLogbooks.length > 0});
        return this.state.logbookSelectionValid;
    }


    submit = (event) => {
        const checkValidity = event.currentTarget.checkValidity();
        event.preventDefault();
        var promise = checkSession();
        if(!promise){
            this.props.setUserData({});
            this.setState({createInProgress: false});
            console.log("not promise");
            return;
        }
        else{
            promise.then(data => {
                if(!data){
                    this.props.setUserData({});
                    this.setState({createInProgress: false});
                    console.log("no data");
                    return;
                }
                else{
                    const selectionsAreValid = this.state.selectedLogbooks.length > 0 && this.state.level !== null;
                    this.setState({validated: true});
                    if (checkValidity && selectionsAreValid){
                        this.setState({createInProgress: true});
                        const { history } = this.props;
                        const logEntry = {
                            logbooks: this.state.selectedLogbooks,
                            tags: this.state.selectedTags,
                            properties: this.state.selectedProperties,
                            title: this.titleRef.current.value,
                            level: this.state.level,
                            description: this.descriptionRef.current.value
                        }
                        let url = this.state.replyAction ? 
                            `${process.env.REACT_APP_BASE_URL}/logs?markup=commonmark&inReplyTo=` + this.state.currentLogEntry.id :
                            `${process.env.REACT_APP_BASE_URL}/logs?markup=commonmark`;
                        axios.put(url, logEntry, { withCredentials: true, headers: ologClientInfoHeader(), baseURL: customization.urlRoot })
                            .then(res => {
                                if(this.state.attachedFiles.length > 0){ // No need to call backend if there are no attachments.
                                    this.submitAttachmentsMulti(res.data.id);
                                }
                                this.setState({createInProgress: false});
                                history.push('/');
                            })
                            .catch(error => {
                                if(error.response && (error.response.status === 401 || error.response.status === 403)){
                                    alert('You are currently not authorized to create a log entry.')
                                }
                                else if(error.response && (error.response.status >= 500)){
                                    alert('Failed to create log entry.')
                                }
                                this.setState({createInProgress: false});
                            });
                    }
                    return;
                }
            });
        }
    }

    selectLevel = (level) => {
        this.setState({level: level});
    }

    addProperty = (property) => {
        this.setState({selectedProperties: [...this.state.selectedProperties, property],
            showAddProperty: false});
    }

    setShowEmbeddImageDialog = (show) => {
        this.setState({showEmbedImageDialog: show});
    }

    setShowHtmlPreview = (show) => {
        this.setState({showHtmlPreview: show});
    }

    getCommonmarkSrc = () => {
        return this.descriptionRef.current.value;
    }

    showGroup = () => {
        if (getLogEntryGroupId(this.state.currentLogEntry.properties)) {
            return true
        }
        return false;
    }

    getAttachedFiles = () => {
        return this.state.attachedFiles;
    }

    removeProperty = (key) => {
        let properties = [...this.state.selectedProperties].filter(property => property.name !== key);
        this.setState({selectedProperties: properties});
    }

    handlePaste = (e) => {
        if (typeof e.clipboardData.files[0] === 'undefined' || e.clipboardData.files[0] === null) {
            return false;
        } else {
            e.preventDefault();
        }
        var  currentFile = e.clipboardData.files[0];
        this.setState({ currentClipboardImageObj: currentFile });
        this.showEmbedDialog();
    }

    handleDrop = (e) => {
        if (typeof e.dataTransfer.files[0] === 'undefined' || e.dataTransfer.files[0] === null) {
            return false;
        } else {
            e.preventDefault();
        }
        var  currentFile = e.dataTransfer.files[0];
        this.setState({ currentClipboardImageObj: currentFile });
        this.showEmbedDialog();
    }

    showEmbedDialog = () => {
        this.setState({showEmbedImageDialog: true});
        this.setState({cursorSelStart: this.descriptionRef.current.selectionStart});
        this.setState({cursorSelEnd: this.descriptionRef.current.selectionEnd});
    }

    onClickEmbeddedImage = () => {
        this.setState({ currentClipboardImageObj: null });
        this.showEmbedDialog();
    }

    addEmbeddedImage = (file, width, height) => {
        this.setState({showEmbedImageDialog: false});
        this.setState({ currentClipboardImageObj: null });
        const id = uuidv4();
        var imageMarkup = "![](attachment/" + id + "){width=" + width + " height=" + height + "}";
        if (isNaN(this.state.cursorSelStart)   || isNaN(this.state.cursorSelEnd)) {
            this.descriptionRef.current.value += imageMarkup;
        } else {
            var logString = this.descriptionRef.current.value;
            var cursorLocation = this.state.cursorStart + imageMarkup.length;
            this.descriptionRef.current.value = logString.substring(0, this.state.cursorSelStart) + imageMarkup + logString.substring(this.state.cursorSelEnd, logString.length);
            this.descriptionRef.current.selectionStart = this.descriptionRef.current.selectionEnd = cursorLocation;
            this.descriptionRef.selectionStart = this.descriptionRef.selectionEnd = cursorLocation;
        }
        const ologAttachment = new OlogAttachment(file, id);
        this.setState({attachedFiles: [...this.state.attachedFiles, ologAttachment]});
    }

    /**
     * Watch the horror!
     * @param {*} property 
     * @param {*} attribute 
     * @param {*} attributeValue 
     */
    updateAttributeValue = (property, attribute, attributeValue) => {
        let copyOfSelectedProperties = [...this.state.selectedProperties];
        let propertyIndex = copyOfSelectedProperties.indexOf(property);
        let copyOfProperty = copyOfSelectedProperties[propertyIndex];
        let attributeIndex = copyOfProperty.attributes.indexOf(attribute);
        let copyOfAttribute = copyOfProperty.attributes[attributeIndex];
        copyOfAttribute.value = attributeValue;
        this.setState({selectedProperties: copyOfSelectedProperties});
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

        const doUpload = this.props.fileName !== '';

        var propertyItems = this.state.selectedProperties.filter(property => property.name !== "Log Entry Group").map((property, index) => {
            return (
                <PropertyEditor key={index}
                    property={property}
                    removeProperty={this.removeProperty}
                    updateAttributeValue={this.updateAttributeValue}/>
            )
        })

        return(
            <>
            {this.state.showError &&
                <h5>Log record id {this.props.match.params.id} not found</h5>
            }
            { !this.state.showError &&
            <>   
                <LoadingOverlay
                            active={this.state.createInProgress}
                            spinner
                            styles={{
                                overlay: (base) => ({
                                ...base,
                                background: 'rgba(97, 97, 97, 0.3)',
                                '& svg circle': {stroke: 'rgba(19, 68, 83, 0.9) !important'}
                                })
                            }}>
                <Container fluid className="full-height">
                    <Form noValidate validated={this.state.validated} onSubmit={this.submit}>
                        <Form.Row>
                            <Form.Label className="new-entry">New Log Entry</Form.Label>
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
                            {this.state.selectedLogbooks.length === 0 && 
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
                        { customization.level &&
                        <Form.Row className="grid-item">
                            <Dropdown as={ButtonGroup}>
                                <Dropdown.Toggle className="selection-dropdown" size="sm" variant="secondary">
                                    {customization.level}                                
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                {customization.levelValues.split(",").map((level, index) => (
                                    <Dropdown.Item eventKey={index}
                                    style={{fontSize: "12px", paddingBottom: "1px"}}
                                    key={index}
                                    onSelect={() => this.selectLevel(level)}>{level}</Dropdown.Item>
                                ))}
                                </Dropdown.Menu>
                            </Dropdown>&nbsp;
                            {this.state.level && <div className="selection">{this.state.level}</div>}
                            {(this.state.level === "" || !this.state.level) && 
                                <Form.Label className="form-error-label" column={true}>Select an entry type.</Form.Label>}
                        </Form.Row>
                        }
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
                                onPaste={this.handlePaste}
                                onDrop={this.handleDrop}
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
                                    onClick={ this.onClickEmbeddedImage }>
                                Embed Image
                            </Button>
                            <Button variant="secondary" size="sm" style={{marginLeft: "5px"}}
                                    onClick={() => this.setState({showHtmlPreview: true})}>
                                Preview
                            </Button>
                            <Button variant="secondary" size="sm" style={{marginLeft: "5px"}}
                                    onClick={() => window.open("https://commonmark.org/help/", "_blank")}>
                                Commonmarkup Help
                            </Button>
                            <Button style={{ marginLeft: "auto" }} variant="primary" onClick={() => {const { history } = this.props; history.push('/');}}>Cancel</Button>
                            <Button style={{ marginLeft: "5px" }} type="submit" disabled={this.props.userData.userName === ""}>Save</Button>
                        </Form.Row>
                        </Form>
                        {this.state.attachedFiles.length > 0 ? <Form.Row className="grid-item">{attachments}</Form.Row> : null}
                        {<Form.Row className="grid-item">
                            <Form.Group style={{width: "400px"}}>
                                <Button variant="secondary" size="sm" disabled="true" onClick={() => this.setState({showAddProperty: true})}>
                                    <span><FaPlus className="add-button"/></span>Add Property
                                </Button>
                                {propertyItems}              
                            </Form.Group>
                        </Form.Row>}
                        { this.getCurrentLogEntry() && this.getReplyAction() &&
                                <LogHistory currentLogEntry={this.getCurrentLogEntry()} showGroup={this.showGroup}/>
                        }
                        </Container>
                    </LoadingOverlay>
                {
                <Modal show={this.state.showAddProperty} onHide={() => this.setState({showAddProperty: false})}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add Property</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <PropertySelector 
                            availableProperties={this.state.availableProperties} 
                            selectedProperties={this.state.selectedProperties}
                            addProperty={this.addProperty}/>
                    </Modal.Body>
                </Modal>
                }

                <EmbedImageDialog showEmbedImageDialog={this.state.showEmbedImageDialog} 
                    imageObj={this.state.currentClipboardImageObj}
                    setShowEmbedImageDialog={this.setShowEmbeddImageDialog}
                    addEmbeddedImage={this.addEmbeddedImage}/>

                <HtmlPreview showHtmlPreview={this.state.showHtmlPreview}
                    setShowHtmlPreview={this.setShowHtmlPreview}
                    getCommonmarkSrc={this.getCommonmarkSrc}
                    getAttachedFiles={this.getAttachedFiles}/>
            </>
            }
            </>
        )
    }
}

export default withRouter(EntryEditor);
