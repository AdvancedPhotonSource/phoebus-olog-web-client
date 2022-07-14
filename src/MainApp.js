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
import Filters from './Filters'
import LogDetails from './LogDetails'
import SearchResultList from './SearchResultList';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import customization from './customization';
import {queryStringToSearchParameters, searchParamsToQueryString, ologClientInfoHeader} from './utils.js';
import Cookies from 'universal-cookie';
import Pagination from 'react-bootstrap/Pagination';


/**
 * Top level component holding the main UI area components.
 */
class MainApp extends Component {

    state = {
          logEntryTree: [],
          selectedLogEntryId: 0,
          searchResult: {
            logs: [],
            hitCount: 0
          },
          searchInProgress: false,
//          logGroupRecords: [],
          showFilters: false,
          searchParams: {},
          pageItems: [],
          currentPageIndex: 1,
          pageSize: customization.defaultPageSize,
          pageCount: 1,
          sortOrder: "down" // Need to maintain sort order here as pagination buttons trigger search.
        };

    cookies = new Cookies();

    componentDidMount = () =>{
        this.props.setReplyAction(false);

      if(Object.values(this.state.searchParams).length === 0){
        let searchParameters = {};
        // Read from cookie
        let searchParamsFromCookie = this.cookies.get('searchString');
        // If this is empty/undefined, fall back to default search params defined in customization
        if(!searchParamsFromCookie || searchParamsFromCookie === ''){
          searchParameters = customization.defaultSearchParams;
        }
        else{
          searchParameters = queryStringToSearchParameters(searchParamsFromCookie);
        }
        this.setState({searchParams: searchParameters});
      }
    }

    search = (sortOrder, from, size, callback) => {
      // Check if search parameters have been defined
      if(Object.values(this.state.searchParams).length === 0){
        let searchParameters = {};
        // Read from cookie
        let searchParamsFromCookie = this.cookies.get('searchString');
        // If this is empty/undefined, fall back to default search params defined in customization
        if(!searchParamsFromCookie || searchParamsFromCookie === ''){
          searchParameters = customization.defaultSearchParams;
        }
        else{
          searchParameters = queryStringToSearchParameters(searchParamsFromCookie);
        }
        this.setState({searchParams: searchParameters, searchInProgress: true}, () => {
          this.doSearch(sortOrder, from, size, callback);
        });
      }
      else{
        this.doSearch(sortOrder, from, size, callback);
      }
    }

    doSearch = (sortOrder, from, size, callback) => {
      let query = searchParamsToQueryString(this.state.searchParams);
      this.cookies.set('searchString', query, {path: '/', maxAge: '100000000'});
      // Append sort, from and size
      query += "&sort=" + sortOrder + "&from=" + from + "&size=" + size;
      fetch(`${process.env.REACT_APP_BASE_URL}/logs/search?` + query, {headers: ologClientInfoHeader()})
            .then(response => {if(response.ok){return response.json();} else {return []}})
            .then(data => {
              this.setState({searchResult: data, searchInProgress: false}, () => callback());
            })
            .catch(() => {this.setState({searchInProgress: false}); alert("Olog service off-line?");})
    }

    setCurrentLogEntry = (logEntry) => {
        this.setState({selectedLogEntryId: logEntry.id});
        this.props.setCurrentLogEntry(logEntry);
    }

    setCurrentPageIndex = (index, search = false) => {
        this.setState({currentPageIndex: index},
        () => { if (search) this.search(this.state.sortOrder, (this.state.currentPageIndex - 1) * this.state.pageSize, this.state.pageSize, this.updatePaginationControls); });
    }

    setPageSize = (size) => {
        this.setState({pageSize: size});
    }

    setPageCount = (count) => {
        this.setState({pageCount: count});
    }

    setSortOrder = (order, search = false) => {
        this.setState({sortOrder: order},
        () => { if (search) this.search(this.state.sortOrder, (this.state.currentPageIndex - 1) * this.state.pageSize, this.state.pageSize, this.updatePaginationControls); });
    }

    updatePaginationControls = () => {
        // Calculate page count
        let newPageCount = Math.ceil(this.state.searchResult.hitCount / this.state.pageSize);
        //this.setPageCount(newPageCount);
        this.setState({pageCount: newPageCount, pageItems: []}, () => {
            let items = [];
            // Calculate first index to render. This depends on the current page index as well as the
            // total page count (which might be greater than the maximum number of buttons: 10).
            let pagesToRender =  Math.min(9, this.state.pageCount - 1);
            let firstIndex = Math.max(1, this.state.currentPageIndex - pagesToRender);
            let lastIndex = firstIndex + pagesToRender;
            for(let i = firstIndex; i <= lastIndex; i++){
                items.push(<Pagination.Item
                    key={i}
                    active={i === this.props.currentPageIndex}
                    onClick={() => this.goToPage(i)}>
                    {i}
                </Pagination.Item>)
            }

            this.setState({pageItems: [...this.state.pageItems, ...items]});
        });
    }


    toggleFilters = () => {
        this.setState({showFilters: !this.state.showFilters});
    }

    setSearchParams = (params) => {
        this.setState({searchParams: params});
    }

  render() {

    return (
      <>
        <Container fluid className="full-height">
          <Row className="full-height">
            <Collapse in={this.state.showFilters}>
                <Col xs={{span: 12, order: 3}} sm={{span: 12, order: 3}} md={{span: 12, order: 3}} lg={{span: 2, order: 1}} style={{padding: "2px"}}>
                  <Filters
                    {...this.state} {...this.props}
                    setSearchParams={this.setSearchParams}
                    updatePaginationControls={this.updatePaginationControls}
                    search={this.search}/>
                </Col>
            </Collapse>
            <Col xs={{span: 12, order: 2}} sm={{span: 12, order: 2}} md={{span: 12, order: 2}} lg={{span: 4, order: 2}} style={{padding: "2px"}}>
              <SearchResultList {...this.state} {...this.props}
                setCurrentLogEntry={this.setCurrentLogEntry}
                setSearchParams={this.setSearchParams}
                search={this.search}
                updatePaginationControls={this.updatePaginationControls}
                setCurrentPageIndex={this.setCurrentPageIndex}
                setPageSize={this.setPageSize}
                setSortOrder={this.setSortOrder}
                setPageCount={this.setPageCount}
                toggleFilters={this.toggleFilters}/>
            </Col>
            <Col  xs={{span: 12, order: 1}} sm={{span: 12, order: 1}} md={{span: 12, order: 1}} lg={{span: this.state.showFilters ? 6 : 8, order: 3}} style={{padding: "2px"}}>
              <LogDetails {...this.state} {...this.props}
                setCurrentLogEntry={this.setCurrentLogEntry}
                setReplyAction={this.props.setReplyAction}
                setLogGroupRecords={this.props.setLogGroupRecords}
                setShowGroup={this.props.setShowGroup} />
            </Col>
          </Row>
        </Container>
      </>
    )
  }
}

export default MainApp
