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
import { Remarkable } from 'remarkable';
import './css/olog.css';
import imageProcessor from './image-processor';
import customization from './customization';
import OlogMoment from './OlogMoment';
import { getLogEntryGroupId, sortLogsDateCreated } from './utils';

class LogHistory extends Component{

    state = {
        logHistory: []
    }

    remarkable = new Remarkable('full', {
        html:         false,        // Enable HTML tags in source
        xhtmlOut:     false,        // Use '/' to close single tags (<br />)
        breaks:       false,        // Convert '\n' in paragraphs into <br>
        langPrefix:   'language-',  // CSS language prefix for fenced blocks
        linkTarget:   '',           // set target to open link in
        // Enable some language-neutral replacements + quotes beautification
        typographer:  false,
      });

    getContent = (source) => {
        this.remarkable.use(imageProcessor, {urlPrefix: customization.urlPrefix});
        return {__html: this.remarkable.render(source)};
    }

    search = () => {
      if(this.state.logHistory && !this.state.logHistory.length) {
        fetch(`${process.env.REACT_APP_BASE_URL}/logs?properties=Log Entry Group.id.` + getLogEntryGroupId(this.props.currentLogEntry.properties))
        .then(response => response.json())
        .then(data => {
            let logs = sortLogsDateCreated(data, false);
            this.setState({ logHistory: logs});
        });
      }
    }

    render(){
        var logGroupItems = null;
        if (this.props.showGroup()) {
            this.search();
            logGroupItems = this.state.logHistory.map((row, index) => {
              return(
                <div key={index}>
                    <div className="separator" >
                        <OlogMoment date={row.createdDate}/>, {row.owner}, {row.title} <span style={{float: "right"}}>{row.id}</span>
                    </div>

                    <div style={{paddingTop: "5px", wordWrap: "break-word"}}
                                    dangerouslySetInnerHTML={this.getContent(row.source)}/>
                </div>
              );
            });
        } else {
            logGroupItems =
                <div>
                    <div className="separator" >
                        <OlogMoment date={this.props.currentLogEntry.createdDate}/>, {this.props.currentLogEntry.owner}, {this.props.currentLogEntry.title} <span style={{float: "right"}}>{this.props.currentLogEntry.id}</span>
                    </div>

                    <div style={{paddingTop: "5px", wordWrap: "break-word"}}
                                    dangerouslySetInnerHTML={this.getContent(this.props.currentLogEntry.source)}/>
                </div> ;
        }

        return(
            <>
                <h1>History</h1>
                <div class="grid-item">
                    {logGroupItems}
                </div>
            </>

        )
    }
}

export default LogHistory;
