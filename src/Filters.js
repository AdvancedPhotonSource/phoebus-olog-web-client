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
import Accordion from 'react-bootstrap/Accordion';
import Logbooks from './Logbooks';
import Tags from './Tags';
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import Container from 'react-bootstrap/Container';
import FormCheck from 'react-bootstrap/FormCheck';
import {getSearchString} from './utils';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import DateTimePicker from 'react-datetime-picker';
import customization from './customization';

/**
 * Component holding search criteria elements, i.e.
 * logbooks, tags and time range.
 */
class Filters extends Component{

    state = {
        openLogbooks: true,
        openTags: false,
        openTimespan: false,
        openFromTo: false,
        openOther: false,
        timeSpan: 2, // default time span item id, e.g. 2 for "30 days"
        searchCriteria: {
            logbooks: [],
            tags: [],
            title: "",
            text: "",
            level: "",
            owner: "",
            startDate: "30 days",
            endDate: "now"
          },
        startDate: new Date(), // Used by calendar component
        endDate: new Date()    // Used by calendar component
    };

    componentDidMount = () => {
        this.props.setSearchString(getSearchString(this.state.searchCriteria, false));
    }

    /**
     * Add or remove logbook from search criteria.
     * @param {string} logbookName 
     * @param {boolean} add 
     */
    addLogbookToSearchCriteria = (logbookName, add) => {
        const copy = {...this.state.searchCriteria};
        if(add){
            copy.logbooks.push(logbookName);
        }
        else{
            copy.logbooks = copy.logbooks.filter(item => item !== logbookName);
        }
        this.setState({searchCriteria: copy}, 
            () =>  {
                const searchCriteriaCopy = {...this.state.searchCriteria};
                this.props.setSearchString(getSearchString(searchCriteriaCopy), true);
            });
    }

    /**
     * Add or remove tag from search criteria.
     * @param {string} tagName 
     * @param {boolean} add 
     */
    addTagToSearchCriteria = (tagName, add) => {
        const copy = {...this.state.searchCriteria};
        if(add){
            copy.tags.push(tagName);
        }
        else{
            copy.tags = copy.tags.filter(item => item !== tagName);
        }
        this.setState({searchCriteria: copy}, 
            () =>  {
                const searchCriteriaCopy = {...this.state.searchCriteria};
                this.props.setSearchString(getSearchString(searchCriteriaCopy), true);
            });
    }

    timespanChanged = (event) => {
        var start;
        var span = parseInt(event.target.id);
        switch(span){
            case 1:
                start = "7 days"; 
                break;
            case 2:
                start = "30 days"; 
                break;
            case 3:
            default:
                start = "90 days";
                break;
            case 4:
                start = "180 days";
                break;
        }
    
        const copy = {...this.state.searchCriteria};
        copy.startDate = start; 
        copy.endDate = "now"; 
        this.setState({searchCriteria: copy, timeSpan: parseInt(event.target.id)},
            () =>  {
                const searchCriteriaCopy = {...this.state.searchCriteria};
                this.props.setSearchString(getSearchString(searchCriteriaCopy), true);
            });
    }

    titleChanged = (event) => {
        const copy = {...this.state.searchCriteria};
        copy.title = event.target.value;
        this.setState({searchCriteria: copy},
            () =>  {
                const searchCriteriaCopy = {...this.state.searchCriteria};
                this.props.setSearchString(getSearchString(searchCriteriaCopy), true);
            });
    }

    textChanged = (event) => {
        const copy = {...this.state.searchCriteria};
        copy.text = event.target.value;
        this.setState({searchCriteria: copy},
            () =>  {
                const searchCriteriaCopy = {...this.state.searchCriteria};
                this.props.setSearchString(getSearchString(searchCriteriaCopy), true);
            });
    }

    levelChanged = (event) => {
        const copy = {...this.state.searchCriteria};
        copy.level = event.target.value;
        this.setState({searchCriteria: copy},
            () =>  {
                const searchCriteriaCopy = {...this.state.searchCriteria};
                this.props.setSearchString(getSearchString(searchCriteriaCopy), true);
            });
    }

    authorChanged = (event) => {
        const copy = {...this.state.searchCriteria};
        copy.owner = event.target.value;
        this.setState({searchCriteria: copy},
            () =>  {
                const searchCriteriaCopy = {...this.state.searchCriteria};
                this.props.setSearchString(getSearchString(searchCriteriaCopy), true);
            });
    }

    dateToString = (value) => {
        return value.getFullYear() + '-' + ('0' + (value.getMonth() + 1)).slice(-2) + '-' + 
               ("0" + value.getDate()).slice(-2) + ' ' + ('0' + value.getHours()).slice(-2) + 
               ':' + ('0' + value.getMinutes()).slice(-2) + ':' + 
               ('0' + value.getSeconds()).slice(-2);
    }

    setStartDate = (value) => {
        this.setState(previous => ({
            searchCriteria: {...this.state.searchCriteria, startDate: this.dateToString(value)},
            startDate: value
        }), () =>  {
            const searchCriteriaCopy = {...this.state.searchCriteria};
            this.props.setSearchString(getSearchString(searchCriteriaCopy), false);
        });
    }

    setEndDate = (value) => {
        this.setState(previous => ({
            searchCriteria: {...this.state.searchCriteria, endDate: this.dateToString(value)},
            endDate: value
        }), () =>  {
            const searchCriteriaCopy = {...this.state.searchCriteria};
            this.props.setSearchString(getSearchString(searchCriteriaCopy), false);
        });
    }

    render(){

        let timeSpans = ["7 days", "30 days", "90 days", "180 days"];

        return(
            <Container className="grid-item filters full-height" style={{paddingLeft: "5px", paddingRight: "5px"}}>
              <h6>Filter Log Entries</h6>
                <Accordion defaultActiveKey="0">
                    <Accordion.Toggle eventKey="0" onClick={() => this.setState({openLogbooks: !this.state.openLogbooks})} 
                        className="accordion-card-header">
                        {this.state.openLogbooks ? <FaChevronDown /> : <FaChevronRight/> } Logbooks
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                       <Logbooks 
                        logbooks={this.props.logbooks} 
                        searchCriteria={this.state.searchCriteria}
                        addLogbookToSearchCriteria={this.addLogbookToSearchCriteria}/>
                    </Accordion.Collapse>
                </Accordion>
                <Accordion>
                    <Accordion.Toggle eventKey="0" onClick={() => this.setState({openTags: !this.state.openTags})}
                         className="accordion-card-header">
                        {this.state.openTags ? <FaChevronDown /> : <FaChevronRight/> } Tags
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                       <Tags tags={this.props.tags}
                            searchCriteria={this.state.searchCriteria}
                            addTagToSearchCriteria={this.addTagToSearchCriteria}/>
                    </Accordion.Collapse>
                </Accordion>
                <Accordion>
                    <Accordion.Toggle eventKey="0" onClick={() => this.setState({openTimespan: !this.state.openTimespan})}
                        className="accordion-card-header">
                        {this.state.openTimespan ? <FaChevronDown /> : <FaChevronRight/> } Created since
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                        <ul  className="olog-ul">
                            {timeSpans.map((timeSpan, index) => (
                                    <li key={index}>
                                        <FormCheck>
                                            <FormCheck.Input type="radio" 
                                                id={index + 1} // For some reason {index} does not work when index = 0.
                                                checked={this.state.timeSpan === index + 1}
                                                onChange={this.timespanChanged}/>
                                            <FormCheck.Label>{timeSpan}</FormCheck.Label>
                                        </FormCheck>
                                    </li>
                            ))}
                        </ul>
                    </Accordion.Collapse>
                </Accordion>
                <Accordion>
                    <Accordion.Toggle eventKey="0" onClick={() => this.setState({openFromTo: !this.state.openFromTo})}
                        className="accordion-card-header">
                        {this.state.openFromTo ? <FaChevronDown /> : <FaChevronRight/> } Created from - to
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                        <Table size="sm" className="search-fields-table">
                            <tbody>
                                <tr>
                                    <td style={{width: "40px"}}>From:</td>
                                    <td>
                                    <DateTimePicker
                                        onChange={(value) => this.setStartDate(value)}
                                        value={this.state.startDate}
                                        format='y-MM-dd HH:mm'
                                        clearIcon=""
                                        disableClock></DateTimePicker>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{width: "40px"}}>To:</td>
                                    <td>
                                    <DateTimePicker
                                        onChange={(value) => this.setEndDate(value)}
                                        value={this.state.endDate}
                                        format='y-MM-dd HH:mm'
                                        clearIcon=""
                                        disableClock></DateTimePicker>
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                       
                    </Accordion.Collapse>
                </Accordion>
                <Accordion>
                    <Accordion.Toggle eventKey="0" onClick={() => this.setState({openOther: !this.state.openOther})}
                        className="accordion-card-header">
                        {this.state.openOther ? <FaChevronDown /> : <FaChevronRight/> } Other search fields
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                        <Table size="sm" className="search-fields-table">
                            <tbody>
                                <tr>
                                    <td>Title:</td>
                                    <td style={{width: "100%"}}>
                                        <Form.Control size="sm" 
                                            type="text" 
                                            value={this.state.searchCriteria.title}
                                            onChange={this.titleChanged}></Form.Control>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Text:</td>
                                    <td>
                                        <Form.Control size="sm" 
                                            type="text" 
                                            value={this.state.searchCriteria.text}
                                            onChange={this.textChanged}></Form.Control>
                                    </td>
                                </tr>
                                { customization.level &&
                                  <tr>
                                    <td>Level:</td>
                                    <td>
                                        <Form.Control size="sm" 
                                            type="text" 
                                            value={this.state.searchCriteria.level}
                                            onChange={this.levelChanged}></Form.Control>
                                    </td>
                                  </tr>
                                }
                                <tr>
                                    <td>Author:</td>
                                    <td>
                                        <Form.Control size="sm" 
                                            type="text" 
                                            value={this.state.searchCriteria.owner}
                                            onChange={this.authorChanged}></Form.Control>
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </Accordion.Collapse>
                </Accordion>
            </Container>
        )
    }
}

export default Filters;
