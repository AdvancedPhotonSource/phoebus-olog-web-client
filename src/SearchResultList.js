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
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import SearchResultItem from './SearchResultItem';
import LoadingOverlay from 'react-loading-overlay';
import { FaArrowUp, FaArrowDown} from "react-icons/fa";
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import {addSortOrder} from './utils';
import Tooltip from 'react-bootstrap/Tooltip';

/**
 * Pane showing search query input and a the list of log entries 
 * matching the query. 
 */
class SearchResultList extends Component{

    componentDidMount = () => {
        this.props.search();
    }

    search = (ascending) => {
        this.props.setSortAscending(ascending);
        let queryWithSortOrder = addSortOrder(this.props.searchString, ascending);
        this.props.setSearchString(queryWithSortOrder);
        this.props.search();
    }

    submit = (event) => {
        event.preventDefault();
        this.search(this.props.sortAscending);
    }

    setSearchString = (event) => {
        this.props.setSearchString(event.target.value, false);
    }

    popover = (
        <Popover id="1">
          <Popover.Title as="h4">How to specify search string</Popover.Title>
          <Popover.Content>To define a time span, specify "start" and "end" times. These can be specified in
                    two different manners:
                    <ol>
                        <li>Relative date/time using expressions like <b>12 hours</b>,
                            <b>1 day</b>, <b>3 weeks</b> or <b>now</b>. The actual timestamp will be calculated
                            by the log service when the search query is submitted.</li>
                        <li>Absolute date/time on the format <pre style={{margin: "0px"}}>yyyy-MM-dd HH:mm:ss.SSS</pre> e.g. <b>2020-12-24 15:30:30.000</b>.</li>
                    </ol>
            </Popover.Content>
        </Popover>
      );

    render(){

        var list = this.props.searchResult.map((item, index) => {
            return <SearchResultItem
                        key={index}
                        log={item}
                        childItem={false}
                        setCurrentLogEntry={this.props.setCurrentLogEntry}
                        selectedLogEntryId={this.props.selectedLogEntryId}/>
        });

        return(
            <Container className="grid-item full-height" style={{paddingLeft: "5px", paddingRight: "5px"}}>
                <Form style={{paddingTop: "5px"}} onSubmit={(e) => this.submit(e)}>
                    <Form.Row>
                        <Col style={{flexGrow: "0", paddingTop: "7px"}}>
                            <OverlayTrigger trigger="click"
                                overlay={this.popover}
                                rootClose
                                placement="right">
                                <Form.Label>Query: </Form.Label>
                            </OverlayTrigger>
                        </Col>
                        <Col style={{paddingLeft: "0px"}}>
                            <Form.Control size="sm" 
                                type="input" 
                                placeholder="No search string"
                                value={this.props.searchString}
                                style={{fontSize: "12px"}}
                                onChange={this.setSearchString}> 
                            </Form.Control>
                        </Col>
                        <Col style={{flexGrow: "0",paddingTop: "7px"}}>
                            <Form.Label>Search: </Form.Label>
                        </Col>
                        <Col style={{flexGrow: "0" }}>
                            <OverlayTrigger delay={{ hide: 450, show: 300 }}
                                overlay={(props) => (
                                    <Tooltip {...props}>Search and sort descending on date</Tooltip>
                                )}
                                rootClose
                                placement="bottom">
                                    <Button 
                                        size="sm"
                                        onClick={(e) => this.search(false)}>
                                        <FaArrowDown/>
                                    </Button>
                            </OverlayTrigger>
                        </Col>
                        <Col style={{flexGrow: "0", paddingLeft: "0px", paddingRight: "0px" }}>
                            <OverlayTrigger delay={{ hide: 450, show: 300 }}
                                    overlay={(props) => (
                                        <Tooltip {...props}>Search and sort ascending on date</Tooltip>
                                    )}
                                    rootClose
                                    placement="bottom">
                                    <Button 
                                        size="sm"
                                        onClick={(e) => this.search(true)}>
                                        <FaArrowUp/>
                                    </Button>
                            </OverlayTrigger>
                        </Col>
                    </Form.Row>
                </Form>
                <LoadingOverlay
                    active={this.props.searchInProgress}
                    spinner
                    styles={{
                        overlay: (base) => ({
                          ...base,
                          background: 'rgba(97, 97, 97, 0.3)',
                          '& svg circle': {stroke: 'rgba(19, 68, 83, 0.9) !important'}
                        })
                      }}>
                <div style={{overflowY: 'scroll', height: 'calc(100vh)'}}>
                    {this.props.searchResult.length > 0 ?
                        list :
                        "No search results"}
                </div>
                </LoadingOverlay>
            </Container>
        )
    }
}

export default SearchResultList;